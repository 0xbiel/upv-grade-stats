"use client";

import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Grade } from "@/lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import { parseGrades } from "@/lib/parser";
import { toast } from "sonner";
import GradeView from "@/components/grade-view";
import LZString from "lz-string";

// Also store options in the URL data
interface GradeShareData {
  grades: Grade[];
  options: {
    maxPossibleGrade: number;
    passThreshold: number;
    normalizeGrades: boolean;
  };
}

export default function Home() {
  // State to manage the value of the textarea
  const [value, setValue] = useState<string>("");

  const [grades, setGrades] = useState<Grade[]>([]);

  // Store last grades for undo
  const [lastGrades, setLastGrades] = useState<Grade[] | null>(null);

  // Options state (sync with grade-view)
  const [maxPossibleGrade, setMaxPossibleGrade] = useState<number>(10);
  const [passThreshold, setPassThreshold] = useState<number>(5);
  const [normalizeGrades, setNormalizeGrades] = useState<boolean>(false);

  // Load grades and options from URL if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("data");
    if (encoded) {
      try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        const data: GradeShareData = JSON.parse(json || "{}") as GradeShareData;
        if (data && Array.isArray(data.grades) && data.grades.length > 0) {
          setGrades(data.grades);
          if (data.options) {
            setMaxPossibleGrade(data.options.maxPossibleGrade ?? 10);
            setPassThreshold(data.options.passThreshold ?? 5);
            setNormalizeGrades(data.options.normalizeGrades ?? false);
          }
        }
      } catch {
        // ignore invalid data
      }
    }
  }, []);

  // Update the URL automatically when grades or options change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (grades.length > 0) {
      try {
        const data: GradeShareData = {
          grades,
          options: {
            maxPossibleGrade,
            passThreshold,
            normalizeGrades,
          },
        };
        const json = JSON.stringify(data);
        const compressed = LZString.compressToEncodedURIComponent(json);
        const url = `${window.location.pathname}?data=${compressed}`;
        window.history.replaceState({}, '', url);
      } catch {
        // ignore
      }
    } else {
      // Remove data param if grades are cleared
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [grades, maxPossibleGrade, passThreshold, normalizeGrades]);

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

    if (parsedGrades.length === 0) {
      console.error("No grades found in the input.");
      toast.error("No grades found in the input.");
      return;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {grades.length > 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 w-[100%]">
          <div className="flex items-center w-full max-w-2xl mb-4 justify-center relative">
            <Image
              src="/logo-upv.svg"
              alt="Description of image"
              width={200}
              height={100}
              className="hover:scale-105 transition-transform duration-300 hover:cursor-pointer"
              onClick={() => {
                setLastGrades(grades);
                setGrades([]);
                setValue("");
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="fixed top-6 right-8 z-30 shadow-md"
            onClick={() => {
              setLastGrades(grades);
              setGrades([]);
              setValue("");
            }}
          >
            New Grades
          </Button>
          <GradeView
            grades={grades}
            maxPossibleGrade={maxPossibleGrade}
            setMaxPossibleGrade={setMaxPossibleGrade}
            passThreshold={passThreshold}
            setPassThreshold={setPassThreshold}
            normalizeGrades={normalizeGrades}
            setNormalizeGrades={setNormalizeGrades}
          />
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
          <div className="mb-4 text-2xl font-semibold text-center">Grade Stats</div>
          {lastGrades && lastGrades.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-6 right-8 z-30 shadow-md"
              onClick={() => {
                setGrades(lastGrades);
                setLastGrades(null);
              }}
            >
              Undo Clear
            </Button>
          )}
          
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
