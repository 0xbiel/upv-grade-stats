"use client";

import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Grade } from "@/lib/types";
import { useState } from "react";
import Image from "next/image";
import { parseGrades } from "@/lib/parser";
import { toast } from "sonner";
import GradeView from "@/components/grade-view";

export default function Home() {
  // State to manage the value of the textarea
  const [value, setValue] = useState<string>("");

  const [grades, setGrades] = useState<Grade[]>([]);

  // Function to handle changes in the textarea
  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  // Function to handle the submit action
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission

    // Parse the grades from the HTML input
    const parsedGrades = parseGrades(value);
    setGrades(parsedGrades);

    console.log("Submitted value:", value);
    if (parsedGrades.length === 0) {
      console.error("No grades found in the input.");
      toast.error("No grades found in the input.");
      return;
    }
    console.log("Parsed grades:", parsedGrades);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {grades.length > 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 w-[100%]">
          <Image
            src="/logo-upv.svg"
            alt="Description of image"
            width={200}
            height={100}
            className="mb-4 hover:scale-105 transition-transform duration-300 hover:cursor-pointer"
            onClick={() => {
              setGrades([]);
              setValue("");
            }}
          />
          <GradeView grades={grades} />
        </div>
      ) : (
        <div className="flex flex-col items-center w-full mt-[25vh]">
          <Image
            src="/logo-upv.svg"
            alt="Description of image"
            width={200}
            height={100}
            className="mb-4"
          />
          <div className="mb-4 text-2xl font-bold text-center">Grade Stats</div>
          <form
            onSubmit={handleSubmit}
            className="border-input bg-white focus-within:ring-ring/15 relative max-w-[90%] w-full md:max-w-3xl mx-auto mb-6 flex items-center rounded-[12px] border px-6 py-4 text-base focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0 min-h-[100px]"
          >
            <AutoResizeTextarea
              value={value}
              onChange={handleChange}
              placeholder="Paste Grades here..."
              className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none w-full min-h-[75px]"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="absolute bottom-4 right-4 size-8 rounded-full"
                  disabled={value.trim() === ""}
                >
                  <a style={{ color: "white" }}>↑</a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Submit</TooltipContent>
            </Tooltip>
          </form>
        </div>
      )}
    </div>
  );
}
