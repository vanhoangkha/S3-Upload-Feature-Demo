import React, { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";

import "./TableDemo.css";

function TableDemo() {
  return (
    <div className="page-content container">
      <div className="page-header text-blue-d2">
        <h1 className="page-title text-secondary-d1">
          Invoice
          <small className="page-info">
            <i className="fa fa-angle-double-right text-80"></i>
            ID: #111-222
          </small>
        </h1>

        <div className="page-tools">
          <div className="action-buttons">
            <a
              className="btn bg-white btn-light mx-1px text-95"
              href="#"
              data-title="Print"
            >
              <i className="mr-1 fa fa-print text-primary-m1 text-120 w-2"></i>
              Print
            </a>
            <a
              className="btn bg-white btn-light mx-1px text-95"
              href="#"
              data-title="PDF"
            >
              <i className="mr-1 fa fa-file-pdf-o text-danger-m1 text-120 w-2"></i>
              Export
            </a>
          </div>
        </div>
      </div>

      <div className="container px-0">
        <div className="row mt-4">
          <div className="col-12 col-lg-12">
            <div className="row">
              <div className="col-12">
                <div className="text-center text-150">
                  <i className="fa fa-book fa-2x text-success-m2 mr-1"></i>
                  <span className="text-default-d3">Bootdey.com</span>
                </div>
              </div>
            </div>

            <hr className="row brc-default-l1 mx-n1 mb-4" />

            <div className="row">
              <div className="col-sm-6">
                <div>
                  <span className="text-sm text-grey-m2 align-middle">To:</span>
                  <span className="text-600 text-110 text-blue align-middle">
                    Alex Doe
                  </span>
                </div>
                <div className="text-grey-m2">
                  <div className="my-1">Street, City</div>
                  <div className="my-1">State, Country</div>
                  <div className="my-1">
                    <i className="fa fa-phone fa-flip-horizontal text-secondary"></i>{" "}
                    <b className="text-600">111-111-111</b>
                  </div>
                </div>
              </div>

              <div className="text-95 col-sm-6 align-self-start d-sm-flex justify-content-end">
                <hr className="d-sm-none" />
                <div className="text-grey-m2">
                  <div className="mt-1 mb-2 text-secondary-m1 text-600 text-125">
                    Invoice
                  </div>

                  <div className="my-2">
                    <i className="fa fa-circle text-blue-m2 text-xs mr-1"></i>{" "}
                    <span className="text-600 text-90">ID:</span> #111-222
                  </div>

                  <div className="my-2">
                    <i className="fa fa-circle text-blue-m2 text-xs mr-1"></i>{" "}
                    <span className="text-600 text-90">Issue Date:</span> Oct 12,
                    2019
                  </div>

                  <div className="my-2">
                    <i className="fa fa-circle text-blue-m2 text-xs mr-1"></i>{" "}
                    <span className="text-600 text-90">Status:</span>{" "}
                    <span className="badge badge-warning badge-pill px-25">
                      Unpaid
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="row text-600 text-white bgc-default-tp1 py-25">
                <div className="d-none d-sm-block col-1">#</div>
                <div className="col-9 col-sm-5">Description</div>
                <div className="d-none d-sm-block col-4 col-sm-2">Qty</div>
                <div className="d-none d-sm-block col-sm-2">Unit Price</div>
                <div className="col-2">Amount</div>
              </div>

              <div className="text-95 text-secondary-d3">
                <div className="row mb-2 mb-sm-0 py-25">
                  <div className="d-none d-sm-block col-1">1</div>
                  <div className="col-9 col-sm-5">Domain registration</div>
                  <div className="d-none d-sm-block col-2">2</div>
                  <div className="d-none d-sm-block col-2 text-95">$10</div>
                  <div className="col-2 text-secondary-d2">$20</div>
                </div>

                <div className="row mb-2 mb-sm-0 py-25 bgc-default-l4">
                  <div className="d-none d-sm-block col-1">2</div>
                  <div className="col-9 col-sm-5">Web hosting</div>
                  <div className="d-none d-sm-block col-2">1</div>
                  <div className="d-none d-sm-block col-2 text-95">$15</div>
                  <div className="col-2 text-secondary-d2">$15</div>
                </div>

                <div className="row mb-2 mb-sm-0 py-25">
                  <div className="d-none d-sm-block col-1">3</div>
                  <div className="col-9 col-sm-5">Software development</div>
                  <div className="d-none d-sm-block col-2">--</div>
                  <div className="d-none d-sm-block col-2 text-95">$1,000</div>
                  <div className="col-2 text-secondary-d2">$1,000</div>
                </div>

                <div className="row mb-2 mb-sm-0 py-25 bgc-default-l4">
                  <div className="d-none d-sm-block col-1">4</div>
                  <div className="col-9 col-sm-5">Consulting</div>
                  <div className="d-none d-sm-block col-2">1 Year</div>
                  <div className="d-none d-sm-block col-2 text-95">$500</div>
                  <div className="col-2 text-secondary-d2">$500</div>
                </div>
              </div>

              <div className="row border-b-2 brc-default-l2"></div>

              <div className="row mt-3">
                <div className="col-12 col-sm-7 text-grey-d2 text-95 mt-2 mt-lg-0">
                  Extra note such as company or payment information...
                </div>

                <div className="col-12 col-sm-5 text-grey text-90 order-first order-sm-last">
                  <div className="row my-2">
                    <div className="col-7 text-right">SubTotal</div>
                    <div className="col-5">
                      <span className="text-120 text-secondary-d1">$2,250</span>
                    </div>
                  </div>

                  <div className="row my-2">
                    <div className="col-7 text-right">Tax (10%)</div>
                    <div className="col-5">
                      <span className="text-110 text-secondary-d1">$225</span>
                    </div>
                  </div>

                  <div className="row my-2 align-items-center bgc-primary-l3 p-2">
                    <div className="col-7 text-right">Total Amount</div>
                    <div className="col-5">
                      <span className="text-150 text-success-d3 opacity-2">
                        $2,475
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              <div>
                <span className="text-secondary-d1 text-105">
                  Thank you for your business
                </span>
                <a
                  href="#"
                  className="btn btn-info btn-bold px-4 float-right mt-3 mt-lg-0"
                >
                  Pay Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TableDemo;
