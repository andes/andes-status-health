import mongodb from 'mongodb';
const { MongoClient } = mongodb;

const HOST = process.env['ANDES_MONGO_HOST'];

async function main() {
    const collection = await getColl('webhookLog');

    const agg = collection.aggregate([
        { $match: { createdAt: { $gte: new Date("2021-10-13") }, status: { $ne: 200 } } },
        { $group: { _id: { url: '$url', status: '$status' }, count: { $sum: 1 } } }
    ]);

    for await (const item of agg) {
        console.log(item);
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