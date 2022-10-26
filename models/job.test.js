"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 200,
    equity: "0.05",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({...newJob, id: expect.any(Number)});

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    console.log(result.rows)
    expect(result.rows).toEqual([
        {
            id: expect.any(Number),
            title: "new",
            salary: 200,
            equity: "0.05",
            company_handle: "c1",
        },
    ]);
  });

});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll(null);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.3",
        companyHandle: "c3",
      },
    ]);
  });
  test("works: filter by minSalary=2", async function () {
    let jobs = await Job.findAll({minSalary:2});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
        },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
        },
    ]);
  });
  test("works: filter by minSalary=1, hasEquity=true", async function () {
    let jobs = await Job.findAll({ minSalary:1, hasEquity:true });
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c2",
        },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 3,
            equity: "0.3",
            companyHandle: "c3",
        },
    ]);
  });
});

/************************************** get */

describe("get", function () {
    
  test("works", async function () {
    const result = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
    let job = await Job.get(result.rows[0].id);
    expect(job).toEqual({
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0.0",
        companyHandle: "c1",
      });
  });

  test("not found if no such Job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 1,
    equity: "0",
  };

  test("works", async function () {
    const res = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
    const { id } = res.rows[0];
    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: id,
      companyHandle: 'c1',
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1 `, [id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "New",
      salary: 1,
      equity: "0",
      companyHandle: 'c1',
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
        title: "New",
        salary: null,
        equity: null,
    };
    const res = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
    const { id } = res.rows[0];
    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id: id,
      companyHandle: 'c1',
      ...updateDataSetNulls,
    });

    const result = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle"
         FROM jobs
         WHERE id = $1 `, [id]);
  expect(result.rows).toEqual([{
    id: expect.any(Number),
    title: "New",
    salary: null,
    equity: null,
    companyHandle: 'c1',
  }]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      const res = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
      const { id } = res.rows[0];
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const result = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
    const { id } = result.rows[0];
    await Job.remove(id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
