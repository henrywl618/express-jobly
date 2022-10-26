"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

let jobID1;

beforeAll( async ()=>{
    await commonBeforeAll();
    const result = await db.query("SELECT id FROM jobs WHERE title='j1'");
    jobID1 = result.rows[0].id;
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 200,
    equity: 0.05,
    companyHandle: "c1",
  };

  test("ok for users with admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob, id: expect.any(Number), equity: "0.05"}
    });
  });

  test("unauth for users without admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newJob,
          equity: 2,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 1,
              equity: "0",
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
          ],
    });
  });

  test("works with filters", async function () {
    const resp = await request(app).get("/jobs?title=j1");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "j1",
                salary: 1,
                equity: "0",
                companyHandle: "c1",
              },
          ],
    });
    const resp2 = await request(app).get("/jobs?minSalary=2");
    expect(resp2.body).toEqual({
      jobs:
          [
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
          ],
    });
    const resp3 = await request(app).get("/jobs?minSalary=1&hasEquity=true");
    expect(resp3.body).toEqual({
      jobs:
          [
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
          ],
    });
  });

  test("fails: invalid filter params", async ()=>{
    const resp = await request(app).get("/jobs?minEmployees=a");
    expect(resp.statusCode).toBe(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobID1}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for users with admin", async function () {
    console.log(jobID1)
    const resp = await request(app)
        .patch(`/jobs/${jobID1}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1-new",
        salary: 1,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for users without admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobID1}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobID1}`)
        .send({
        title: "j1-new",
        })
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobID1}`)
        .send({
          id: 999,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobID1}`)
        .send({
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobID1}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${jobID1}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobID1}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobID1}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
