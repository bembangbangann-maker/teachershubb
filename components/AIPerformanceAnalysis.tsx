

import React, { useState, useEffect } from 'react';
import { analyzeStudentPerformance } from '../services/geminiService';
import { Student, Grade, AIAnalysisResult, Anecdote } from '../types';
import { SparklesIcon } from './icons';
import { toast } from 'react-hot-toast';

interface AIPerformanceAnalysisProps {
  students: Student[];
  grades: Grade[];
  anecdotes: Anecdote[];
}

const getCardStyle = (summary: string) => {
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('excel') || lowerSummary.includes('improv') || lowerSummary.includes('high')) {
        return {
            border: 'border-success',
            iconColor: 'text-success',
            title: 'Excelling Student'
        };
    }
    if (lowerSummary.includes('declin') || lowerSummary.includes('struggl') || lowerSummary.includes('low') || lowerSummary.includes('inconsistent')) {
        return {
            border: 'border-warning',
            iconColor: 'text-warning',
            title: 'Student At-Risk'
        };
    }
    return {
        border: 'border-info',
        iconColor: 'text-info',
        title: 'Notable Trend'
    };
}


const AIPerformanceAnalysis: React.FC<AIPerformanceAnalysisProps> = ({ students, grades, anecdotes }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult[]>([]);

  useEffect(() => {
    const runAnalysis = async () => {
      if (students.length === 0 || grades.length === 0) {
          setIsLoading(false);
          setAnalysisResults([]);
          return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const results = await analyzeStudentPerformance(students, grades, anecdotes);
        setAnalysisResults(results);
        if (results.length > 0) {
            toast.success('AI analysis complete!');
        }
      } catch (err) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, grades, anecdotes]);

  if (isLoading) {
    return (
      <div className="text-center p-8 bg-base-200 rounded-lg">
        <SparklesIcon className="w-12 h-12 text-primary mx-auto animate-pulse" />
        <p className="mt-4 text-lg">Analyzing performance data...</p>
        <p className="text-sm text-base-content">The AI is identifying trends across all quarters and generating recommendations. This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-error/20 rounded-lg">
        <h3 className="font-bold text-lg text-error">Analysis Failed</h3>
        <p className="text-base-content">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-info/20 rounded-lg border-l-4 border-info">
        <h3 className="font-bold flex items-center text-info"><SparklesIcon className="w-5 h-5 mr-2"/>AI-Powered Insights</h3>
        <p className="text-sm text-base-content mt-1">The AI has analyzed grade trends and anecdotal records to identify students who are excelling or may need additional support. Recommendations are provided for potential intervention or enrichment.</p>
      </div>
      
      {analysisResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysisResults.map((result, index) => {
            const style = getCardStyle(result.trendSummary);
            return (
                <div key={index} className={`bg-base-200 p-4 rounded-lg border-l-4 ${style.border}`}>
                  <h4 className={`text-lg font-bold ${style.iconColor}`}>{result.studentName}</h4>
                  <p className="text-sm text-base-content italic mt-1">"{result.trendSummary}"</p>
                  <div className="mt-3 pt-3 border-t border-base-300">
                    <p className="text-sm font-semibold text-primary">Recommendation:</p>
                    <p className="text-base-content">{result.recommendation}</p>
                  </div>
                </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center p-8 bg-success/20 rounded-lg border-l-4 border-success">
          <h3 className="font-bold text-lg text-success">All Clear!</h3>
          <p className="text-base-content">The AI analysis did not detect any significant performance trends requiring special attention at this time. All students appear to be on a stable track.</p>
        </div>
      )}
    </div>
  );
};

export default AIPerformanceAnalysis;