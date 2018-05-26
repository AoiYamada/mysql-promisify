const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const path = require('path');
const CWD = process.cwd();

const { MySQL } = require(path.join(CWD, 'MySQL'));
const mysql = require('mysql');

const db = new MySQL({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    charset: 'utf8',
    database: 'test',
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
        } catch (err) {
            should.not.exist(err.message || err);
        }
    });

    it('Read Data From DB', async() => {
        try {
            const { results, fields } = await db.query({
                sql: `SELECT * FROM test;`
            });
            expect(results).to.be.an('array');
            expect(fields).to.be.an('array');
        } catch (err) {
            should.not.exist(err.message || err);
        }
    });

    it('Use escape string as column name or table name', async() => {
        try {
            const table = 'test';
            const { results, fields } = await db.query({
                sql: `SELECT * FROM |table;`,
                params: {
                    table
                }
            });
            expect(results).to.be.an('array');
            expect(fields).to.be.an('array');
        } catch (err) {
            should.not.exist(err.message || err);
        }
    });

    it('Get the substituded sql', () => {
        const data = {
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
        };

        const query = MySQL.queryFormat(data.sql, data.params);
        expect(query).equal(`
                    INSERT INTO
                        test
                        (
                            testcol1, 
                            testcol2, 
                            testcol3
                        )
                    VALUES
                        (
                            ${mysql.escape(data.params.val1)},
                            ${mysql.escape(data.params.val2)},
                            ${mysql.escape(data.params.val3)}
                        )
                    ;
                `);
    });

    describe('Transaction', () => {
        it('Rollback', async() => {
            try {
                const tdb = await db.getTransactionDb();
                expect(tdb).to.be.an.instanceof(MySQL);
                expect(tdb.connectionType).equal('PoolConnection');

                const { results: read_results_before } = await db.query({
                    sql: `SELECT * FROM test;`
                });

                const { results: insert_results } = await tdb.query({
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
                expect(insert_results).to.be.a('object');
                expect(insert_results.affectedRows).equal(1);
                await tdb.rollback();
                expect(tdb._connection).equal();

                const { results: read_results_after } = await db.query({
                    sql: `SELECT * FROM test;`
                });
                expect(read_results_before.length).equal(read_results_after.length);
            } catch (err) {
                should.not.exist(err.message || err);
            }
        });
        it('Commit', async() => {
            try {
                const tdb = await db.getTransactionDb();
                expect(tdb).to.be.an.instanceof(MySQL);
                expect(tdb.connectionType).equal('PoolConnection');

                const { results: read_results_before } = await db.query({
                    sql: `SELECT * FROM test;`
                });

                const { results: insert_results } = await tdb.query({
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
                expect(insert_results).to.be.a('object');
                expect(insert_results.affectedRows).equal(1);
                await tdb.commit();
                expect(tdb._connection).equal();

                const { results: read_results_after } = await db.query({
                    sql: `SELECT * FROM test;`
                });
                expect(read_results_before.length + 1).equal(read_results_after.length);
            } catch (err) {
                should.not.exist(err.message || err);
            }
        });
    });

    // it('Testing', async() => {
    //     try {
    //         const tdb = await db.getTransactionDb();
    //         const tdb2 = db.getTransactionDb();
    //         const tdb3 = db.getTransactionDb();
    //         const tdb4 = db.getTransactionDb();
    //         const tdb5 = db.getTransactionDb();
    //         const tdb6 = db.getTransactionDb();
    //         const tdb7 = db.getTransactionDb();
    //         const tdb8 = db.getTransactionDb();
    //         const tdb9 = db.getTransactionDb();
    //         const tdb10 = db.getTransactionDb();
    //         const tdb11 = db.getTransactionDb();
    //         const tdb12 = db.getTransactionDb();
    //         const tdb13 = db.getTransactionDb();
    //         const tdb14 = db.getTransactionDb();
    //         await Promise.all([
    //             tdb2,
    //             tdb3,
    //             tdb4,
    //             tdb5,
    //             tdb6,
    //             tdb7,
    //             tdb8,
    //             tdb9,
    //             tdb10,
    //             tdb11,
    //             new Promise(resolve => setTimeout(async () => {
    //                 (await tdb2).rollback();
    //                 (await tdb3).rollback();
    //                 (await tdb4).rollback();
    //                 (await tdb5).rollback();
    //                 (await tdb6).rollback();
    //                 resolve();
    //             }, 1000))
    //         ]);
    //         // await tdb.query({
    //         //     sql: `
    //         //             INSERT INTO
    //         //                 test
    //         //                 (
    //         //                     testcol1, 
    //         //                     testcol2, 
    //         //                     testcol3
    //         //                 )
    //         //             VALUES
    //         //                 (
    //         //                     :val1,
    //         //                     :val2,
    //         //                     :val3
    //         //                 )
    //         //             ;
    //         //         `,
    //         //     params: {
    //         //         val1: 123,
    //         //         val2: 456,
    //         //         val3: 789,
    //         //     },
    //         // });
    //         // await tdb.rollback();
    //         // expect(results).to.be.a('object');
    //         // expect(results.affectedRows).equal(1);
    //         // await tdb.rollback();
    //         // expect(tdb).to.be.an.instanceof(MySQL);
    //     } catch (err) {
    //         should.not.exist(err.message || err);
    //     }
    // });

    after(async() => {
        try {
            expect(await db.end()).equal();
        } catch (err) {
            should.not.exist(err);
        }
    });
});