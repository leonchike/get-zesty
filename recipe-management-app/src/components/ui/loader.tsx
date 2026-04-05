"use client";

import React, { useState, useEffect } from "react";

function Delayed({
  children,
  wait,
}: {
  children: React.ReactNode;
  wait: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, wait);

    return () => clearTimeout(timeout);
  });

  return <>{show && children}</>;
}

export const LoadingSpinner = ({ delay = 5000 }) => {
  return (
    <Delayed wait={delay}>
      <div className="flex justify-center items-center">
        <div className="animate-spin h-0 w-0 p-4 border-4 border-gray-300 border-r-transparent rounded-full"></div>
      </div>
    </Delayed>
  );
};

export function FullPageSpinner({ delay = 500 }) {
  return (
    <div className="w-full h-[90vh] grid place-content-center">
      <LoadingSpinner delay={delay} />
    </div>
  );
}
