import React from "react";

const DateSeparator = ({ date }) => {
  const label = new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="divider text-xs text-base-content/60 my-6">
      {label}
    </div>
  );
};

export default DateSeparator;
