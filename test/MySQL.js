const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const path = require('path');
const CWD = process.cwd();

const { MySQL } = require(path.join(CWD, 'MySQL'));

const db = new MySQL({
    host: '127.0.0.1',
    user: 'root',
    password: 'admin',
    charset: 'utf8',
    database: 'test_2',
    timeout: 60000,
    // multipleStatements: true,
});

describe('MySQL', () => {
    it('Create Data to DB', async() => {
        try {
            const { results, fields } = await db.query({
                sql: `
                        INSERT INTO
                            test
                            (
                                testcol1, 
                                testcol2, 
                                testcol3
                            )
                        VALUES
                            (
                                :val1,
                                :val2,
                                :val3
                            )
                        ;
                    `,
                params: {
                    val1: 123,
                    val2: 456,
                    val3: 789,
                },
            });
            expect(results).to.be.a('object');
            expect(results.affectedRows).equal(1);
            should.not.exist(fields);
        } catch(err) {
            should.not.exist(err.message||err);
        }
    });

    it('Read Data From DB', async() => {
        try {
            const { results, fields } = await db.query({
                sql: `SELECT * FROM test;`
            });
            expect(results).to.be.a('array');
            expect(fields).to.be.a('array');
        } catch(err) {
            should.not.exist(err.message||err);
        }
    });

    after(async () => {
        try {
            expect(await db.end()).equal(null);
        } catch(err) {
            should.not.exist(err);
        }
    });
});