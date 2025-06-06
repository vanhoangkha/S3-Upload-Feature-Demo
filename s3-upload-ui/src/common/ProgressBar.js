import React, { useEffect, useState } from "react";
import "./ProgressBar.css";

export const ProgressBar = (props) => {
  let { status, percentage, label, additionalInfo, description } = props;
  useEffect(() => {
    status = props.status;
    percentage = props.percentage;
    label = props.label;
    additionalInfo = props.additionalInfo;
    description = props.description;
    console.log("percentage ", percentage);
  }, [status]);
  return (
    <div className="progress-bar-custome">
      <div>{label}</div>
      <small>{description}</small>
      {status == "in-progress" && (
        <div className="progress-bar-layer">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
      {status == "success" && (
        <div>
          <i className="fa-regular fa-circle-check text-green"></i>
        </div>
      )}
      <small>{additionalInfo}</small>
    </div>
  );
};
