// Import mysql library
const mysql = require('mysql');

// Import the pool directly from the database module
const pool = require('../database'); // Adjust the path accordingly

class DatabaseTable {
  constructor(table, primaryKey) {
    // Use the imported pool
    this.pool = pool;
    this.table = table;
    this.primaryKey = primaryKey;
  }

  queryAsync(sql, values) {
    return new Promise((resolve, reject) => {
      this.pool.query(sql, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  async find(field, value) {
    const query = `SELECT * FROM ${this.table} WHERE ${field} = ?`;
    const results = await this.queryAsync(query, [value]);
    return results;
  }

  async findBookings(field, value) {
    let query = `SELECT * FROM ${this.table}`;

    if (field === 'status' && value === 'Has Paid') {
      query += ` WHERE ${field} = 'Has Paid' AND visited = "Hasn't Visited"`;
    }

    const results = await this.queryAsync(query);
    return results;
  }

  async findBookingsNotFree(field, value) {
    let query = `SELECT * FROM ${this.table}`;

    if (field === 'status' && value === 'Has Paid') {
      query += ` WHERE ${field} = 'Has Paid' AND price != 0`;
    }

    const results = await this.queryAsync(query);
    return results;
  }

  async findByUID(uId) {
    const query = `SELECT * FROM ${this.table} WHERE uId = ?`;
    const results = await this.queryAsync(query, [uId]);
    return results;
  }

  async updateWithUID(uId, record) {
    // Create a new object for values without modifying the original record object
    const updatedValues = { ...record };

    const setStatements = Object.keys(updatedValues).map(key => `${key} = ?`).join(', ');

    // Add the user id condition
    const query = `UPDATE ${this.table} SET ${setStatements} WHERE uId = ?`;

    const results = await this.queryAsync(query, [...Object.values(updatedValues), uId]);

    return results;
  }

  async findBookingsByDoctorAndStatus(doctor, status) {
    let query = `SELECT * FROM ${this.table} WHERE doctor = ? AND visited = ?`;
    const results = await this.queryAsync(query, [doctor, status]);
    return results;
  }

  async findPrescriptionsByPatientIdAndStatus(patientId, status) {
    const query = `SELECT * FROM ${this.table} WHERE patientId = ? AND status = ?`;
    const results = await this.queryAsync(query, [patientId, status]);
    return results;
  }

  async findAll() {
    const query = `SELECT * FROM ${this.table}`;
    const results = await this.queryAsync(query);
    return results;
  }

  async insert(record) {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = Array(values.length).fill('?').join(', ');

    const query = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const results = await this.queryAsync(query, values);

    return results;
  }

  async insertPayment(record) {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = Array(values.length).fill('?').join(', ');

    const query = `INSERT INTO payments (${keys.join(', ')}) VALUES (${placeholders})`;
    const results = await this.queryAsync(query, values);

    return results;
  }

  async insertPrescriptionPayment(record) {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = Array(values.length).fill('?').join(', ');

    const query = `INSERT INTO prescription_payments (${keys.join(', ')}) VALUES (${placeholders})`;
    const results = await this.queryAsync(query, values);

    return results;
  }

  async insertInvestigations(record) {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = Array(values.length).fill('?').join(', ');

    const query = `INSERT INTO investigation_payments (${keys.join(', ')}) VALUES (${placeholders})`;
    const results = await this.queryAsync(query, values);

    return results;
  }

  async updateByPaymentId(paymentId, record) {
    try {
      // Create a new object for values without modifying the original record object
      const updatedValues = { ...record };

      // Construct the SET statements for updating the fields
      const setStatements = Object.keys(updatedValues).map(key => `${key} = ?`).join(', ');

      // Construct the SQL query to update rows based on paymentId
      const query = `UPDATE ${this.table} SET ${setStatements} WHERE paymentId = ?`;

      // Execute the SQL query asynchronously
      const results = await this.queryAsync(query, [...Object.values(updatedValues), paymentId]);

      return results;
    } catch (error) {
      console.error('Error updating records by paymentId:', error);
      throw error; // Propagate the error to the caller
    }
  }


  async update(primaryValue, record) {
    const id = primaryValue;

    // Create a new object for values without modifying the original record object
    const updatedValues = { ...record };
    delete updatedValues[this.primaryKey]; // Remove the primary key from the updated values

    const setStatements = Object.keys(updatedValues).map(key => `${key} = ?`).join(', ');

    // Add the primary key separately
    const query = `UPDATE ${this.table} SET ${setStatements} WHERE ${this.primaryKey} = ?`;

    // Convert primary key to integer if necessary
    const idAsInteger = parseInt(id, 10);

    const results = await this.queryAsync(query, [...Object.values(updatedValues), idAsInteger]);
    return results;
  }


  async deleteAll(column, id) {
    const query = `DELETE FROM ${this.table} WHERE ${column} = ?`;
    const results = await this.queryAsync(query, [id]);

    return results;
  }

  async clearAll() {
    const query = `DELETE FROM ${this.table}`;
    const results = await this.queryAsync(query);
    return results;
  }

  async delete(id) {
    const query = `DELETE FROM ${this.table} WHERE ${this.primaryKey} = ?`;
    const results = await this.queryAsync(query, [id]);

    return results;
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.pool.end(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = DatabaseTable;
