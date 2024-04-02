import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../../components/containers/Context';
import { responsiveArray } from 'antd/es/_util/responsiveObserver';

const ReceptionistInvoice = () => {
    const { bookingId } = useParams();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const form = useRef();
    // const twilio = require('twilio');
    const { currentUser } = useAuth();
    console.log("currentUser:", currentUser);

    useEffect(() => {
        console.log('Booking ID:', bookingId); // Log the bookingId
        const fetchPaymentDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/thomas/getpaymentdetails/${bookingId}`);
                const paymentDetails = response.data.PaymentDetails;
                setPaymentDetails(paymentDetails);
                setLoading(false); // Set loading to false after fetching data
                console.log(paymentDetails);
            } catch (error) {
                console.error('Error fetching payment details:', error);
                setLoading(false); // Set loading to false in case of error
            }
        };

        fetchPaymentDetails();
    }, [bookingId]);

    const convertToPositive = (number) => {
        return number < 0 ? Math.abs(number) : number;
    };

    const [email, setEmail] = useState('');
    const [user_email, setUserEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    // Function to send email with invoice PDF as attachment
    const sendEmail = async (e) => {
        e.preventDefault();

        const serviceId = 'service_94v9r5m';
        const templateId = 'template_wm15jg9';
        const publicKey = 'ocZfDv5ECRiYPbqSN';

        try {

            const templateParams = {
                // Replace placeholders with actual values
                'Client Name': `${paymentDetails.firstname} ${paymentDetails.lastname}`,
                'Client Email': paymentDetails.email,
                'Invoice Number': paymentDetails.receiptNo,
                'Date': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                'Payment Date': new Date(paymentDetails.payment_datecreate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                'Total Amount': `₦${paymentDetails.total_amount}`,
                'Amount Paid': `₦${paymentDetails.amount_paid}`,
                'Method of Payment': paymentDetails.method,
                'Balance': `₦${paymentDetails.balance}`,
                'Your Name': `${currentUser.firstname} ${currentUser.lastname}`,
                'Your Position': currentUser.adminType,
                'Your Email': currentUser.email,
                'Your Number': currentUser.number,
            };

            // Send email using emailjs
            console.log('Sending email...');
            const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
            console.log('Email sent response:', response);

            if (response.status === 200) {
                setErrorMessage('Email sent successfully');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            } else {
                console.error('Unexpected response:', response.data);
                setErrorMessage('Unexpected response. Please try again.');
                setShowErrorAlert(true);
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            setErrorMessage('Error sending email. Please try again.');
            setShowErrorAlert(true);
            window.scrollTo(0, 0);
        }
    };


    const print_invoice = () => {
        const invoiceSection = document.getElementById('invoice');
        if (invoiceSection) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<html><head>
                    <meta charset="utf-8" />
                    <title>${paymentDetails.firstname}'s Receipt</title>
                    <style>
                        .invoice-box {
                            max-width: 800px;
                            height: 100%;
                            margin: auto;
                            font-size: 16px;
                            line-height: 24px;
                            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                            color: #555;
                        }
    
                        .invoice-box table {
                            width: 100%;
                            line-height: inherit;
                            text-align: left;
                        }
    
                        .invoice-box table td {
                            padding: 5px;
                            vertical-align: top;
                        }
    
                        .invoice-box table tr td:nth-child(2) {
                            text-align: right;
                        }
    
                        .invoice-box table tr.top table td {
                            padding-bottom: 20px;
                        }
    
                        .invoice-box table tr.top table td.title {
                            font-size: 45px;
                            line-height: 45px;
                            color: #333;
                        }
    
                        .invoice-box table tr.information table td {
                            padding-bottom: 40px;
                        }
    
                        .invoice-box table tr.heading td {
                            background: #eee;
                            border-bottom: 1px solid #ddd;
                            font-weight: bold;
                        }
    
                        .invoice-box table tr.details td {
                            padding-bottom: 20px;
                        }
    
                        .invoice-box table tr.item td {
                            border-bottom: 1px solid #eee;
                        }
    
                        .invoice-box table tr.item.last td {
                            border-bottom: none;
                        }
    
                        .invoice-box table tr.total td:nth-child(2) {
                            border-top: 2px solid #eee;
                            font-weight: bold;
                        }

                        .invoice-item {
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            padding: 10px;
                            margin-top: 50px;
                        }                           
    
                        .invoice-notes {
                            border: 0.5px solid rgba(204, 204, 204, 0.5);
                            border-radius: 15px;
                            padding: 20px;
                            margin-top: 20px;
                        }
    
                        .invoice-from,
                        .invoice-to {
                            font-size: 1.5rem;
                        }
    
                        .invoice-note {
                            font-size: 1rem;
                            color: grey;
                            margin-top: 10px;
                        }
    
                        .invoice-contact {
                            font-size: 1rem;
                            color: grey;
                            margin-top: 7px;
                        }
    
                        .invoice-summary {
                            margin-top: 30px;
                            padding: 10px;
                        }
    
                        .invoice-summary table {
                            width: 100%;
                            border-collapse: collapse;
                        }
    
                        .invoice-summary th,
                        .invoice-summary td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
    
                        .invoice-summary th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>`);

                printWindow.document.write(`
                    <div class="invoice-box">
                        <table cellpadding="0" cellspacing="0">
                            <tr class="top">
                                <td colspan="2">
                                    <table>
                                        <tr>
                                            <td class="title">
                                                <img src=${process.env.PUBLIC_URL}/img/logo.jpg style="width: 100%; max-width: 300px" />
                                            </td>
                                            <td>
                                                <strong>#${paymentDetails.receiptNo}</strong><br />
                                                Date: <strong>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong><br />
                                                Payment made on: <strong>${new Date(paymentDetails.payment_datecreate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="information">
                                <td class="invoice-from">
                                    <strong class="invoice_from">From:</strong><br />
                                    <div class="invoice-note">Toronto Hospital Limited</div>
                                    <div class="invoice-contact">torontohospital@yahoo.com</div>
                                    <div class="invoice-contact">+234 909 000 0379</div>
                                </td>
                                <td class="invoice-to">
                                    <strong class="invoice_to">To:</strong><br />
                                    <div class="invoice-note">${paymentDetails.firstname} ${paymentDetails.lastname}</div>
                                    <div class="invoice-note">${paymentDetails.email}</div>
                                    <div class="invoice-contact">${paymentDetails.number}</div>
                                </td>
                            </tr>
                        
                        </table>
                        <div class="invoice-item">
                            <table>
                                <tr class="heading">
                                    <td>Type of Registration</td>
                                    <td>Price</td>
                                </tr>
                                <tr class="item">
                                    <td>${paymentDetails.typeofvisit}</td>
                                    <td>₦${paymentDetails.total_amount}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="invoice-summary">
                            <table>
                                <tr>
                                    <th>Currency</th>
                                    <th style="text-align: right">NGN (₦)</th>
                                </tr>
                                <tr>
                                    <td>Method of Payment:</td>
                                    <td style="text-align: right">${paymentDetails.method}</td>
                                </tr>
                                <tr>
                                    <td>Amount Paid:</td>
                                    <td style="text-align: right">₦${paymentDetails.amount_paid}</td>
                                </tr>
                                <tr>
                                    <td>Grand Total:</td>
                                    <td style="text-align: right; color: green;">₦${paymentDetails.total_amount}</td>
                                </tr>
                                <tr>
                                    <td>Balance</td>
                                    <td style="text-align: right">₦${convertToPositive(paymentDetails.balance)}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="invoice-notes">
                            <div class="d-flex align-items-center" style="font-size: 1.2rem; padding-top: 20px;">
                                <div class="ps-3">
                                    <strong>Notes</strong>
                                </div>
                            </div>
                            <div class="ps-3" style="font-size: 1rem; padding-top: 10px;">
                                <p>
                                    Thank you for choosing Toronto Hospital for your healthcare needs. We appreciate your trust in us. Should you have any questions or need further assistance, please don't hesitate to contact us.
                                </p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>`);

                // Close the document
                printWindow.document.close();

                // Print the window
                printWindow.print();
            } else {
                console.error('Error opening print window');
            }
        } else {
            console.error('Invoice section not found');
        }
    };

    const download_invoice = async () => {
        try {
            const options = {
                filename: `${paymentDetails.firstname} ${paymentDetails.lastname} ${paymentDetails.pId} ${paymentDetails.payment_datecreate} invoice.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'ledger', orientation: 'landscape' } // Custom dimensions for landscape orientation
            };

            console.log('Generating PDF...');
            console.log('Invoice section:', document.getElementById('invoice')); // Log the invoice section
            const pdf_invoice = document.getElementById('invoice');

            // Generate PDF from the section element with id "invoice"
            await html2pdf().from(pdf_invoice).set(options).save();
            console.log('PDF saved successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const sendSMS = async () => {
        try {
            // Send POST request to server-side endpoint to send SMS
            const response = await axios.post('/thomas/sendSMS', {
                recipientPhoneNumber: '+447424730895' // Replace with recipient phone number
            });

            // Log the message ID returned by the server
            console.log('SMS sent successfully. Message ID:', response.data.messageId);
        } catch (error) {
            console.error('Error sending SMS:', error);
        }
    };


    return (
        <main id="main" className="main">
            <div className="pagetitle">
                <h1 style={{ fontSize: '1.5rem' }}>Invoice</h1>
            </div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                paymentDetails ? (
                    <section className="section dashboard">
                        <div className="row">
                            <div className="col-lg-12">
                                {/* Left side columns */}
                                <div className="row justify-content-end">
                                    {/* Share button */}
                                    <div className="col-4">
                                        <button data-bs-toggle="modal" data-bs-target="#share"
                                        className='btn btn-outline-secondary btn-md'>Share                        
                                        <i className="bi bi-share" style={{ paddingLeft: '15px' }}></i>
                                        </button>
                                        &nbsp;
                                        <button onClick={print_invoice}
                                        className='btn btn-outline-secondary btn-md'>Print                        
                                        <i className="bi bi-printer" style={{ paddingLeft: '15px' }}></i>
                                        </button>
                                        &nbsp;
                                        <button onClick={download_invoice}
                                        className='btn btn-outline-secondary btn-md'>Download                        
                                        <i className="bi bi-download" style={{ paddingLeft: '15px' }}></i>
                                        </button>
                                    </div><br/><br/>

                                </div>
                            </div>
                        </div>

                    </section>
                ) : (
                    <section className="section dashboard">
                        <div className="row">
                            <div className="col-lg-12">
                                {/* Left side columns */}
                                <div className="row justify-content-end">
                                    {/* Share button */}
                                    <div className="col-4" style={{ display: 'flex', alignItems: 'center', width: '150px' }}>
                                        <div className="card info-card sales-card" style={{ padding: '10px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f0f8fa', border: '2.5px dotted #000', width: '100%' }}>
                                            <span data-bs-toggle="modal" data-bs-target="#share" style={{ textAlign: 'left', paddingLeft: '15px' }}>Share<i className="bi bi-share" style={{ paddingLeft: '15px' }}></i></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            )}
            {/* Display error message as an alert */}
            {showErrorAlert && (
                <div className={`form-control alert ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {errorMessage}
                </div>
            )}
            <section className="section" id='invoice'>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="row invoice-content" style={{ margin: '20px' }}>
                                {loading ? (
                                    <div>Loading...</div>
                                ) : (
                                    paymentDetails ? (
                                        <div className="col-lg-12">
                                            <div className="row">
                                                <div className="col-4">
                                                    <img
                                                        src={`${process.env.PUBLIC_URL}/img/logo.jpg`}
                                                        style={{ width: '100%', maxWidth: '600px' }}
                                                        className="invoice-logo"
                                                        alt="Thomas Logo"
                                                    />
                                                </div>
                                                <div className="col-4"></div>
                                                <div className="col-4 invoice-info" style={{ textAlign: 'right', fontSize: '1rem' }}>
                                                    <p>#<strong>{paymentDetails.receiptNo}</strong></p>
                                                    <p>Date: <strong>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
                                                    <p>Payment made on: <strong>{new Date(paymentDetails.payment_datecreate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
                                                </div>
                                            </div>
                                            <div className="row" style={{ marginTop: '30px' }}>
                                                <div className="col-6">
                                                    <div className="card info-card sales-card invoice-from" style={{ border: '0.5px solid rgba(204, 204, 204, 0.5)', borderRadius: '15px' }}>
                                                        <div className="card-body">
                                                            <div className="d-flex align-items-center" style={{ fontSize: '1.5rem', paddingTop: '20px' }}>
                                                                <div className="ps-3">
                                                                    <strong>From:</strong>
                                                                </div>
                                                            </div>
                                                            <div className="ps-3" style={{ fontSize: '1rem', paddingTop: '10px' }}>
                                                                <strong>Toronto Hospital Limited</strong><br />
                                                                <div style={{ marginTop: '10px', color: 'grey' }}><strong style={{ fontWeight: 'normal' }}>torontohospital@yahoo.com</strong></div>
                                                                <div style={{ marginTop: '7px', color: 'grey' }}><strong style={{ fontWeight: 'normal' }}>+234 909 000 0379</strong></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="card info-card sales-card invoice-to" style={{ border: '0.5px solid rgba(204, 204, 204, 0.5)', borderRadius: '15px' }}>
                                                        <div className="card-body">
                                                            <div className="d-flex align-items-center" style={{ fontSize: '1.5rem', paddingTop: '20px' }}>
                                                                <div className="ps-3">
                                                                    <strong>To:</strong>
                                                                </div>
                                                            </div>
                                                            <div className="ps-3" style={{ fontSize: '1rem', paddingTop: '10px' }}>
                                                                <strong>{paymentDetails.firstname} {paymentDetails.lastname}</strong><br />
                                                                <div style={{ marginTop: '10px', color: 'grey' }}><strong style={{ fontWeight: 'normal' }}>{paymentDetails.email}</strong></div>
                                                                <div style={{ marginTop: '7px', color: 'grey' }}><strong style={{ fontWeight: 'normal' }}>{paymentDetails.number}</strong></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row" style={{ marginTop: '10px' }}>
                                                <div className="col-7">
                                                    <div className="card info-card sales-card invoice-details" style={{ padding: '30px', border: '0.5px solid rgba(204, 204, 204, 0.5)', borderRadius: '15px' }}>
                                                        <table className='table table-hover' style={{ padding: '20px' }} cellPadding="0" cellSpacing="0">
                                                            <thead>
                                                                <tr className="heading" style={{ fontSize: '1.2rem' }}>
                                                                    <td><strong>Type of Registration</strong></td>
                                                                    <td><strong>Price</strong>(₦)</td>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="details">
                                                                    <td>{paymentDetails.typeofvisit}</td>
                                                                    <td>{paymentDetails.amount_paid}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div className="col-5">
                                                    <div className="card-body">
                                                        <div className="invoice-summary">
                                                            <table className='table table-borderless' cellPadding="0" cellSpacing="10">
                                                                <thead>
                                                                    <tr className="heading" style={{ fontSize: '1.2rem' }}>
                                                                        <td>Currency</td>
                                                                        <td style={{ textAlign: 'right' }}><strong>NGN (₦)</strong></td>
                                                                    </tr>
                                                                </thead>
                                                                <thead>
                                                                    <tr className="heading" style={{ fontSize: '1.2rem' }}>
                                                                        <td>Method of Payment:</td>
                                                                        <td style={{ textAlign: 'right' }}><strong>{paymentDetails.method}</strong></td>
                                                                    </tr>
                                                                </thead>
                                                                <thead>
                                                                    <tr className="heading" style={{ fontSize: '1.2rem' }}>
                                                                        <td>Amount Paid:</td>
                                                                        <td style={{ textAlign: 'right' }}><strong>₦{paymentDetails.amount_paid}</strong></td>
                                                                    </tr>
                                                                </thead>
                                                                <thead>
                                                                    <tr className="heading" style={{ fontSize: '1.2rem' }}>
                                                                        <td>Grand Total:</td>
                                                                        <td style={{ textAlign: 'right', color: 'green' }}><strong>₦{paymentDetails.total_amount}</strong></td>
                                                                    </tr>
                                                                </thead>
                                                                <thead>
                                                                    <tr className="heading" style={{ fontSize: '1.2rem' }}>
                                                                        <td>Balance</td>
                                                                        <td style={{ textAlign: 'right' }}><strong>₦{convertToPositive(paymentDetails.balance)}</strong></td>
                                                                    </tr>
                                                                </thead>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card info-card sales-card invoice-notes" style={{ border: '0.5px solid rgba(204, 204, 204, 0.5)', borderRadius: '15px' }}>
                                                    <div className="card-body">
                                                        <div className="d-flex align-items-center" style={{ fontSize: '1.2rem', paddingTop: '20px' }}>
                                                            <div className="ps-3">
                                                                <strong>Notes</strong>
                                                            </div>
                                                        </div>
                                                        <div className="ps-3" style={{ fontSize: '1rem', paddingTop: '10px' }}>
                                                            <p>
                                                                Thank you for choosing Toronto Hospital for your healthcare needs. We appreciate your trust in us.
                                                                Should you have any questions or need further assistance, please don't hesitate to contact us.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>Email a reminder to pay</div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="card">
                <div className="modal fade" id="share" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Share with Patient via</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div><button data-bs-dismiss="modal" onClick={sendEmail} style={{ width: '100%', textAlign: 'left' }} className="btn btn-outline-success"><i style={{ padding: '15px' }} className="bi bi-envelope"></i>Send to Email</button></div>
                                <br />
                                <div><button data-bs-dismiss="modal" onClick={sendSMS} style={{ width: '100%', textAlign: 'left' }} className="btn btn-outline-success"><i style={{ padding: '15px' }} className="bi bi-telephone-fill"></i>Send to Phone Number</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};
export default ReceptionistInvoice;
