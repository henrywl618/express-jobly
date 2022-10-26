const { BadRequestError } = require("../expressError");

/**Returns an object containing the partial string query of columns being updated and the values to be updated to.*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Given an object containing any number of the following filter params { name, minEmployees, maxEmployees }
 * 
 * Returns a SQL WHERE clause to filter the query*/
function sqlForFiltering(filterParams) {
  const keys = Object.keys(filterParams);
  console.log(keys)
  const filters = keys.map((key, idx)=>{
    if(key === "name") return `LOWER(name) LIKE '%'||$${idx+1}||'%'`;
    if(key === "minEmployees") return `num_employees >=$${idx+1}`;
    if(key === "maxEmployees") return `num_employees <=$${idx+1}`;     
  });
  return{
    sql: "WHERE " + filters.join(" AND "),
    values: Object.values(filterParams)
  }
};

/** Given an object containing any number of the following filter params { title, minSalary, hasEquity }
 * 
 * Returns a SQL WHERE clause to filter the query*/
 function sqlForFilteringJobs(filterParams) {
  const keys = Object.keys(filterParams);
  const values = [];
  let idx = 0;
  console.log(keys)
  const filters = keys.map((key)=>{
    if(key === "title") {
      values.push(filterParams[key]);
      idx++;
      return `LOWER(title) LIKE '%'||$${idx}||'%'`
    };
    if(key === "minSalary") {
      values.push(filterParams[key]);
      idx++;
      return `salary >=$${idx}`
    };
    if(key === "hasEquity" && filterParams[key]) return `equity > 0`;     
  });
  return{
    sql: "WHERE " + filters.join(" AND "),
    values: values,
  }
};

module.exports = { sqlForPartialUpdate, sqlForFiltering, sqlForFilteringJobs };
