const { sqlForPartialUpdate, sqlForFiltering, sqlForFilteringJobs } = require("./sql");

describe("sqlForPartialUpdate", ()=>{
    test("works: returns object with string query and array of values", ()=>{
        const result = sqlForPartialUpdate({name:"TestName", description:"test"},{description:"company_description"});
        expect(result).toEqual({setCols:'"name"=$1, "company_description"=$2', values:["TestName", "test"]});
    })
});

describe("sqlForFiltering", ()=>{
    test("works: returns object with string query and array of values", ()=>{
        const result = sqlForFiltering({name:"TestName", minEmployees:500});
        expect(result).toEqual({sql:"WHERE LOWER(name) LIKE '%'||$1||'%' AND num_employees >=$2", values:["TestName", 500]});
    })
});

describe("sqlForFilteringJobs", ()=>{
    test("works: returns object with string query and array of values", ()=>{
        const result = sqlForFilteringJobs({title:"TestName", hasEquity:true});
        expect(result).toEqual({sql:"WHERE LOWER(title) LIKE '%'||$1||'%' AND equity > 0", values:["TestName"]});
        const result2 = sqlForFilteringJobs({title:"TestName", minSalary:10000.99});
        expect(result2).toEqual({sql:"WHERE LOWER(title) LIKE '%'||$1||'%' AND salary >=$2", values:["TestName", 10000.99]});
    })
});