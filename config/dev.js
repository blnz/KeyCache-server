//

exports.httpPort =  process.env.HTTP_PORT || 3000
exports.dbConnection =  {
    host: process.env.PGHOST || 'localhost',
    port: 5432,
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'ssdb',
    password: process.env.PGPASSWORD || 'ssdb'
}
