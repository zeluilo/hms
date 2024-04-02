import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns'; // Import date-fns functions
import ApexChart from 'react-apexcharts';

const Reports = () => {
  const [monthlyPayments, setMonthlyPayments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/thomas/get-payment-price');
        const { appointments, prescriptions, investigations } = response.data;

        console.log('Response Data:', response.data);
        // Calculate total_amount for each month
        const monthlyTotalAmounts = {};
        const monthlyPrescriptionPrices = {};
        const monthlyInvestigationPrices = {};

        appointments.forEach(appointment => {
          const paymentDate = new Date(appointment.payment_datecreate);
          const monthKey = format(paymentDate, 'yyyy-MM');

          if (!monthlyTotalAmounts[monthKey]) {
            monthlyTotalAmounts[monthKey] = 0;
          }

          monthlyTotalAmounts[monthKey] += parseFloat(appointment.total_amount) || 0;
        });

        prescriptions.forEach(prescription => {
          const paymentDate = new Date(prescription.payment_datecreate);
          const monthKey = format(paymentDate, 'yyyy-MM');

          if (!monthlyPrescriptionPrices[monthKey]) {
            monthlyPrescriptionPrices[monthKey] = 0;
          }

          monthlyPrescriptionPrices[monthKey] += parseFloat(prescription.prescription_price) || 0;
        });

        investigations.forEach(investigation => {
          const paymentDate = new Date(investigation.payment_datecreate);
          const monthKey = format(paymentDate, 'yyyy-MM');

          if (!monthlyInvestigationPrices[monthKey]) {
            monthlyInvestigationPrices[monthKey] = 0;
          }

          monthlyInvestigationPrices[monthKey] += parseFloat(investigation.investigation_price) || 0;
        });

        // Combine total amounts and prescription prices into a single object
        const monthlyPayments = {};
        Object.keys(monthlyTotalAmounts).forEach(month => {
          monthlyPayments[month] = {
            totalAmount: monthlyTotalAmounts[month],
            prescriptionPrice: monthlyPrescriptionPrices[month] || 0,
            investigationPrice: monthlyInvestigationPrices[month] || 0,
            totalPayment: monthlyTotalAmounts[month] + (monthlyPrescriptionPrices[month] || 0) + (monthlyInvestigationPrices[month] || 0)
          };
        });

        setMonthlyPayments(monthlyPayments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter out invalid or missing dates and format them properly
  const validMonthlyPayments = Object.entries(monthlyPayments)
    .filter(([month]) => month !== 'Invalid Date' && month !== undefined)
    .map(([month, payment]) => ({
      month: format(new Date(month), 'MMM yyyy'),
      ...payment
    }));

  // Render the chart
  return (
    <main id="main" className="main">
      <div className="pagetitle">
        <h1>Dashboard</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="index.html">Home</Link></li>
            <li className="breadcrumb-item active">Dashboard</li>
          </ol>
        </nav>
      </div>

      <section className="section dashboard">
        <div className="row">
          <div className="col-lg-12">
            <div className="row">
              <div className="card-body">
                <h5 className="card-title">Monthly Payments</h5>
                <div className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <ApexChart
                        options={{
                          chart: {
                            height: 350,
                            type: 'area',
                            toolbar: {
                              show: false
                            }
                          },
                          xaxis: {
                            categories: validMonthlyPayments.map(payment => payment.month),
                            labels: {
                              rotate: -45,
                              formatter: value => value
                            }
                          },
                          yaxis: {
                            title: {
                              text: 'Total Payments (Naira)'
                            }
                          },
                          dataLabels: {
                            enabled: false
                          },
                          markers: {
                            size: 4
                          },
                          colors: ['#4154f1', '#2eca6a', '#ff771d', '#B7FF00'],
                          fill: {
                            type: "gradient",
                            gradient: {
                              shadeIntensity: 1,
                              opacityFrom: 0.3,
                              opacityTo: 0.4,
                              stops: [0, 90, 100]
                            }
                          },
                          stroke: {
                            curve: 'smooth',
                            width: 2
                          }
                        }}
                        series={[
                          {
                            name: 'Total Price from Appointments',
                            data: validMonthlyPayments.map(payment => payment.totalAmount)
                          },
                          {
                            name: 'Total Price from Pharmacy',
                            data: validMonthlyPayments.map(payment => payment.prescriptionPrice)
                          },
                          {
                            name: 'Total Price from Doctors',
                            data: validMonthlyPayments.map(payment => payment.investigationPrice)
                          },
                          {
                            name: 'Total Amount Made',
                            data: validMonthlyPayments.map(payment => payment.totalPayment)
                          }
                        ]}
                        type="area"
                        height={350}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Reports;
