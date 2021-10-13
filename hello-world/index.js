import mongodb from 'mongodb';
import { sendMessage } from './slack.js';
import moment from 'moment';

const { MongoClient } = mongodb;

const HOST = process.env['ANDES_MONGO_HOST'];


async function main() {
    const collection = await getColl('webhookLog');

    const start = moment().subtract(1, 'hour').startOf('hour').toDate()
    const end = moment().subtract(1, 'hour').endOf('hour').toDate()

    const agg = collection.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: start,
                    $lte: end
                },
                status: { $ne: 200 }
            }
        },
        { $group: { _id: { url: '$url', status: '$status' }, count: { $sum: 1 } } },
        {
            $project: {
                microservicio: '$_id.url',
                status: '$_id.status',
                count: '$count'
            }
        }
    ]);

    let message = '';
    for await (const item of agg) {
        if (item.count > 10) {
            message += `MS=${item.microservicio} STATUS=${item.status} COUNT=${item.count}\n`
        }
    }

    if (message.length > 0) {
        await sendMessage(message);
    }

    process.exit(0);
}

const databases = {};
const getConnection = async function (name, url) {
    try {
        if (databases[name]) {
            return databases[name];
        } else {
            const conn = await MongoClient.connect(url, { slave_ok: true });
            const db = conn.db(name);
            databases[name] = db;
            return db;
        }
    } catch (err) {
        console.warn(err.message);
        process.exit();
    }
}

async function getColl(name) {
    const db = await getConnection('andes', HOST);
    return db.collection(name);
}

main();
