import React from "react";

const EmptyRecipeSectionState = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-full flex-grow select-none">
      <h3 className="text font-medium text-gray-500 mb-2">{message}</h3>
    </div>
  );
};

export default EmptyRecipeSectionState;
