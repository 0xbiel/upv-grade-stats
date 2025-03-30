import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Grade } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { 
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Label as ChartLabel
} from "recharts";
import { Switch } from "@/components/ui/switch";

// Define sorting types
type SortColumn = 'studentName' | 'grade' | 'status';
type SortDirection = 'asc' | 'desc';

export default function GradeView({ grades }: { grades: Grade[] }) {
  const [avarage, setAvarage] = useState<number>(0);
  const [median, setMedian] = useState<number>(0);
  const [maxGrade, setMaxGrade] = useState<number>(0);
  const [minGrade, setMinGrade] = useState<number>(0);
  const [passRate, setPassRate] = useState<number>(0);
  const [standardDeviation, setStandardDeviation] = useState<number>(0);

  // Grading options
  const [maxPossibleGrade, setMaxPossibleGrade] = useState<number>(10);
  const [passThreshold, setPassThreshold] = useState<number>(5);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [normalizeGrades, setNormalizeGrades] = useState<boolean>(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('studentName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Compute normalized grades when needed
  const normalizedGrades = useMemo(() => {
    if (!normalizeGrades || maxPossibleGrade === 10) return grades;

    return grades.map(grade => ({
      ...grade,
      grade: (grade.grade / maxPossibleGrade) * 10,
      originalGrade: grade.grade // Keep original grade
    }));
  }, [grades, normalizeGrades, maxPossibleGrade]);

  // Use normalized grades when normalization is enabled
  const displayGrades = normalizeGrades ? normalizedGrades : grades;

  // Normalized pass threshold when normalization is enabled
  const normalizedPassThreshold = normalizeGrades
    ? (passThreshold / maxPossibleGrade) * 10
    : passThreshold;

  useEffect(() => {
    if (displayGrades.length === 0) return;

    const totalGrades = displayGrades.reduce((acc, grade) => acc + grade.grade, 0);
    const average = totalGrades / displayGrades.length;
    setAvarage(average);

    const sortedGrades = [...displayGrades].sort((a, b) => a.grade - b.grade);
    const mid = Math.floor(sortedGrades.length / 2);
    const median =
      sortedGrades.length % 2 !== 0
        ? sortedGrades[mid].grade
        : (sortedGrades[mid - 1].grade + sortedGrades[mid].grade) / 2;
    setMedian(median);

    const maxGrade = Math.max(...displayGrades.map((grade) => grade.grade));
    setMaxGrade(maxGrade);

    const minGrade = Math.min(...displayGrades.map((grade) => grade.grade));
    setMinGrade(minGrade);

    // Use normalized threshold for pass rate calculation
    const passRate =
      (displayGrades.filter((grade) => grade.grade >= normalizedPassThreshold).length / displayGrades.length) * 100;
    setPassRate(passRate);

    const variance =
      displayGrades.reduce(
        (acc, grade) => acc + Math.pow(grade.grade - average, 2),
        0,
      ) / displayGrades.length;
    setStandardDeviation(Math.sqrt(variance));
  }, [displayGrades, normalizedPassThreshold]);

  // Generate histogram data
  const histogramData = useMemo(() => {
    if (displayGrades.length === 0) return [];

    // Determine number of bins based on max scale (always 10 when normalized)
    const effectiveMax = normalizeGrades ? 10 : maxPossibleGrade;
    const binSize = effectiveMax <= 10 ? 1 : 10;
    const numBins = Math.ceil(effectiveMax / binSize);
    const bins = Array(numBins).fill(0);

    // Count grades in each bin
    displayGrades.forEach(grade => {
      const binIndex = Math.min(Math.floor(grade.grade / binSize), numBins - 1);
      bins[binIndex]++;
    });

    // Create data for chart - ensure all required properties are defined
    return bins.map((count, index) => ({
      range: `${index * binSize}-${(index + 1) * binSize}`,
      count: count,
      isPassing: index * binSize >= normalizedPassThreshold
    }));
  }, [displayGrades, maxPossibleGrade, normalizedPassThreshold, normalizeGrades]);

  // Check if we have valid data for the chart
  const hasValidChartData = histogramData.length > 0;

  // Create data for the pie chart
  const pieChartData = useMemo(() => {
    if (displayGrades.length === 0) return [];
    
    const passed = displayGrades.filter(grade => grade.grade >= normalizedPassThreshold).length;
    const failed = displayGrades.length - passed;
    
    return [
      { name: "Passed", value: passed, fill: "#10b981" }, // Direct green color
      { name: "Failed", value: failed, fill: "#ef4444" }, // Direct red color
    ];
  }, [displayGrades, normalizedPassThreshold]);
  
  // Calculate the total number of students for the pie chart center
  const totalStudents = displayGrades.length;

  // Sorted grades for display
  const sortedGrades = useMemo(() => {
    if (!displayGrades.length) return [];
    
    return [...displayGrades].sort((a, b) => {
      if (sortColumn === 'studentName') {
        return sortDirection === 'asc'
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      } 
      
      if (sortColumn === 'grade') {
        return sortDirection === 'asc'
          ? a.grade - b.grade
          : b.grade - a.grade;
      }
      
      // Sort by status (pass/fail)
      const aPass = a.grade >= normalizedPassThreshold;
      const bPass = b.grade >= normalizedPassThreshold;
      
      if (aPass === bPass) {
        // If both have same status, sort by grade
        return sortDirection === 'asc'
          ? a.grade - b.grade
          : b.grade - a.grade;
      }
      
      // Sort by pass/fail status
      return sortDirection === 'asc'
        ? (aPass ? 1 : -1)
        : (aPass ? -1 : 1);
    });
  }, [displayGrades, sortColumn, sortDirection, normalizedPassThreshold]);

  // Function to handle sort changes
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Helper to render sort indicators
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="overflow-x-auto w-full max-w-[90%] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">
          Grade Statistics
          {normalizeGrades && <span className="ml-2 text-sm font-normal text-muted-foreground">(normalized out of 10)</span>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-1"
        >
          <Settings className="h-4 w-4" />
          {showOptions ? "Hide Options" : "Show Options"}
          {showOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {showOptions && (
        <Card className="p-4 mb-6 animate-in fade-in-50 slide-in-from-top-5 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="gradeScale">Maximum Grade Value</Label>
              <Input
                type="number"
                id="gradeScale"
                value={maxPossibleGrade}
                onChange={(e) => setMaxPossibleGrade(Number(e.target.value))}
                min={1}
                step={1}
                className="max-w-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                The maximum possible grade (e.g., 10, 100)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passGrade">Pass Threshold</Label>
              <Input
                type="number"
                id="passGrade"
                value={passThreshold}
                onChange={(e) => setPassThreshold(Number(e.target.value))}
                className="max-w-[120px]"
                min={0}
                max={maxPossibleGrade}
                step={0.1}
              />
              <p className="text-sm text-muted-foreground">
                Grades of {passThreshold} or higher are considered passing
                {normalizeGrades && maxPossibleGrade !== 10 && (
                  <span className="block mt-1">
                    (normalized: {(passThreshold / maxPossibleGrade * 10).toFixed(1)}/10)
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="normalizeGrades">Normalize Grades (0-10 scale)</Label>
                <Switch
                  id="normalizeGrades"
                  checked={normalizeGrades}
                  onCheckedChange={setNormalizeGrades}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Convert all grades to a 0-10 scale for easier comparison
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Average</span>
          <span className="text-2xl">{avarage.toFixed(2)}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Median</span>
          <span className="text-2xl">{median.toFixed(2)}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Max Grade</span>
          <span className="text-2xl">{maxGrade}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Min Grade</span>
          <span className="text-2xl">{minGrade}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Pass Rate</span>
          <span className="text-2xl">{passRate.toFixed(2)}%</span>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Standard Deviation</span>
          <span className="text-2xl">{standardDeviation.toFixed(2)}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Histogram Chart - Now on the left */}
        <Card className="p-4">
          <div className="mb-4 text-xl font-semibold">
            Grade Distribution
            {normalizeGrades && maxPossibleGrade !== 10 && <span className="ml-2 text-sm font-normal text-muted-foreground">(normalized out of 10)</span>}
          </div>
          <div className="h-[300px] w-full">
            {hasValidChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={histogramData} 
                  margin={{ top: 5, right: 20, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="range" 
                    tickMargin={10} 
                    axisLine={true}
                  />
                  <YAxis 
                    allowDecimals={false}
                    label={{ 
                      value: 'Number of Students', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} students`, 'Count']}
                    labelFormatter={(label) => `Grade range: ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.9}
                    name="Count"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No grade data available to display chart
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
            <span>Grade distribution by ranges</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Not passing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span>Passing</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pass/Fail Pie Chart - Now on the right */}
        <Card className="p-4">
          <div className="mb-4 text-xl font-semibold text-center">
            Pass/Fail Distribution
            {normalizeGrades && maxPossibleGrade !== 10 && <span className="ml-2 text-sm font-normal text-muted-foreground">(normalized out of 10)</span>}
          </div>
          <div className="h-[300px] w-full">
            {totalStudents > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70} // Increased inner radius for slimmer look
                    outerRadius={90}
                    paddingAngle={4} // Increased padding angle
                    stroke="#fff" // White stroke for better separation
                    strokeWidth={3}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill} 
                      />
                    ))}
                    <ChartLabel
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <g>
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={((viewBox.cy ?? 0) - 10)}
                                  className="fill-foreground text-3xl font-bold"
                                >
                                  {passRate.toFixed(0)}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy ?? 0) + 15}
                                  className="fill-muted-foreground text-sm"
                                >
                                  Pass Rate
                                </tspan>
                              </text>
                            </g>
                          )
                        }
                        return null;
                      }}
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name) => [
                      `${value} students (${((value / totalStudents) * 100).toFixed(1)}%)`, 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No grade data available to display chart
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex justify-center items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#10b981" }}></div>
                <span>Passed: {pieChartData[0]?.value || 0} students</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#ef4444" }}></div>
                <span>Failed: {pieChartData[1]?.value || 0} students</span>
              </div>
            </div>
            <div className="text-center mt-2">
              Pass threshold: {normalizeGrades 
                ? `${normalizedPassThreshold.toFixed(1)}/10` 
                : `${passThreshold}/${maxPossibleGrade}`}
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4 text-2xl font-bold text-center">Grades Table</div>
      <div className="rounded-md border">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('studentName')}
              >
                <div className="flex items-center">
                  Student Name
                  {getSortIcon('studentName')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('grade')}
              >
                <div className="flex items-center">
                  Grade{normalizeGrades && " (normalized)"}
                  {getSortIcon('grade')}
                </div>
              </TableHead>
              {normalizeGrades && <TableHead>Original Grade</TableHead>}
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGrades.map((grade, index) => (
              <TableRow key={grade.studentName}>
                <TableCell className="text-center font-mono text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>{grade.studentName}</TableCell>
                <TableCell>{grade.grade.toFixed(1)}</TableCell>
                {normalizeGrades && <TableCell>{(grade as any).originalGrade?.toFixed(1) || grade.grade.toFixed(1)}</TableCell>}
                <TableCell>
                  <span className={grade.grade >= normalizedPassThreshold ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {grade.grade >= normalizedPassThreshold ? "Pass" : "Fail"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead colSpan={normalizeGrades ? 5 : 4}>
                Total Students: {displayGrades.length}
              </TableHead>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
