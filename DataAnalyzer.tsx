import React, { useState } from 'react';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import SpinnerIcon from './icons/SpinnerIcon';
import BrainIcon from './icons/BrainIcon';
import XCircleIcon from './icons/XCircleIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import SparklesIcon from './icons/SparklesIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ChipIcon from './icons/ChipIcon';

interface DataAnalyzerProps {
  textContent: string | null;
  imageData: {
    url: string;
    base64: string;
    mimeType: string;
  } | null;
  onClose: () => void;
}

interface TextAnalysisResult {
    dataType: string;
    summary: string;
    risks: string[];
}

interface ImageAnalysisResult {
  description: string;
  tags: string[];
  anomaly: string;
}

type AnalysisResult = TextAnalysisResult | ImageAnalysisResult;

function isImageAnalysis(result: any): result is ImageAnalysisResult {
    return result && typeof result.description === 'string' && Array.isArray(result.tags);
}

const DataAnalyzer: React.FC<DataAnalyzerProps> = ({ textContent, imageData, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let response: GenerateContentResponse;

            if (imageData) {
                 const imagePart = {
                    inlineData: {
                        mimeType: imageData.mimeType,
                        data: imageData.base64,
                    },
                };
                const textPart = { text: "You are PhantomV, a futuristic AI data analyst. Your analysis should be concise and adopt a cyberpunk, high-tech tone. Analyze the provided image and generate a response. Describe the visual content, identify up to 5 relevant tags, and point out one potential anomaly or point of interest. If no anomaly is found, state 'None detected'." };

                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: { parts: [textPart, imagePart] },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                description: { 
                                    type: Type.STRING, 
                                    description: 'A concise, one-sentence description of the image in a cyberpunk tone.' 
                                },
                                tags: {
                                    type: Type.ARRAY,
                                    description: 'Up to 5 relevant keywords or tags identifying objects and themes in the image.',
                                    items: { type: Type.STRING }
                                },
                                anomaly: {
                                    type: Type.STRING,
                                    description: 'A potential anomaly or point of interest found in the image. If none, state "None detected".'
                                }
                            },
                            required: ['description', 'tags', 'anomaly']
                        },
                    },
                });
            } else if (textContent) {
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Analyze the following data payload. Data: \n\n${textContent}`,
                    config: {
                        systemInstruction: "You are PhantomV, a futuristic AI data analyst. Your analysis should be concise and adopt a cyberpunk, high-tech tone. Identify the data type (e.g., JSON, JavaScript, Text Log), provide a one-sentence summary, and list up to 3 potential security keywords or notable patterns.",
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                dataType: { 
                                    type: Type.STRING, 
                                    description: 'The type of data, e.g., JSON, JavaScript Code, Text Log, Article.' 
                                },
                                summary: { 
                                    type: Type.STRING, 
                                    description: 'A concise, one-sentence summary of the content in a cyberpunk tone.' 
                                },
                                risks: {
                                    type: Type.ARRAY,
                                    description: 'Up to 3 potential security keywords or notable patterns found (e.g., "API Key", "Password", "Private Data").',
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ['dataType', 'summary', 'risks']
                        },
                    },
                });
            } else {
                throw new Error("No content provided for analysis.");
            }
            
            const resultJson = JSON.parse(response.text);
            setAnalysis(resultJson);

        } catch (e) {
            console.error(e);
            setError("Analysis failed. The AI core might be offline or the data payload is corrupted.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 text-sky-300 animate-fade-in">
                    <SpinnerIcon className="h-16 w-16" />
                    <p className="text-xl font-bold tracking-widest uppercase animate-pulse">Analyzing Payload...</p>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 text-red-400 animate-fade-in">
                    <XCircleIcon className="h-16 w-16" />
                    <p className="text-xl font-bold tracking-widest uppercase">Analysis Error</p>
                    <p className="text-center font-sans text-gray-400">{error}</p>
                     <button
                        onClick={handleAnalyze}
                        className="w-full max-w-xs relative inline-flex items-center justify-center p-0.5 mt-4 overflow-hidden text-base font-bold rounded-lg group bg-gradient-to-br from-blue-600 to-fuchsia-600 hover:shadow-neon-blue"
                    >
                        <span className="w-full relative px-5 py-2.5 transition-all ease-in duration-150 bg-gray-900 rounded-md group-hover:bg-opacity-0 text-white tracking-widest uppercase">
                            Retry Analysis
                        </span>
                    </button>
                </div>
            )
        }

        if (analysis) {
            const isImgAnalysis = isImageAnalysis(analysis);
            const textAnalysis = isImgAnalysis ? null : (analysis as TextAnalysisResult);

            return (
                <div className="animate-fade-in w-full">
                    <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-green-300 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(125,211,252,0.4)]">Analysis Complete</h3>
                    <div className="mt-8 space-y-6 font-sans">
                        {isImgAnalysis ? (
                            <>
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-sky-400"><SparklesIcon className="h-5 w-5"/>Visual Description</h4>
                                    <p className="mt-2 text-lg text-gray-200 italic">"{analysis.description}"</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-sky-400"><ChipIcon className="h-5 w-5"/>Detected Tags</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {analysis.tags.map((tag, i) => (
                                            <span key={i} className="text-base text-fuchsia-300 font-mono bg-fuchsia-500/10 px-2 py-1 rounded-md">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-sky-400"><ShieldCheckIcon className="h-5 w-5"/>Anomaly Scan</h4>
                                    <p className="mt-2 text-lg text-gray-200">{analysis.anomaly}</p>
                                </div>
                            </>
                        ) : textAnalysis ? (
                            <>
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-sky-400"><DocumentTextIcon className="h-5 w-5"/>Data Type</h4>
                                    <p className="mt-2 text-lg text-gray-200">{textAnalysis.dataType}</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-sky-400"><SparklesIcon className="h-5 w-5"/>Threat Summary</h4>
                                    <p className="mt-2 text-lg text-gray-200 italic">"{textAnalysis.summary}"</p>
                                </div>
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
                                    <h4 className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-sky-400"><ShieldCheckIcon className="h-5 w-5"/>Noteworthy Patterns</h4>
                                    {textAnalysis.risks.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                        {textAnalysis.risks.map((risk, i) => (
                                            <li key={i} className="text-lg text-fuchsia-300 font-mono bg-fuchsia-500/10 px-2 py-1 rounded-md">{risk}</li>
                                        ))}
                                        </ul>
                                    ) : <p className="mt-2 text-lg text-gray-400">No immediate threats detected in payload.</p>}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )
        }
        
        const buttonText = imageData ? "Analyze Image" : "Initiate Analysis";

        return (
            <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
                {imageData ? (
                     <div className="relative">
                        <img src={imageData.url} alt="Analysis subject" className="h-32 w-32 object-cover rounded-lg shadow-lg shadow-fuchsia-500/20" />
                        <BrainIcon className="absolute -bottom-3 -right-3 h-12 w-12 text-fuchsia-400 bg-black/70 rounded-full p-2" />
                    </div>
                ) : (
                    <BrainIcon className="h-24 w-24 text-fuchsia-400 drop-shadow-[0_0_12px_rgba(217,70,239,0.6)]" />
                )}

                <p className="text-center text-lg text-gray-300 font-sans max-w-sm">
                   {imageData ? "Image payload is ready for deep analysis by the PhantomV AI core." : "The synchronized data is ready for deep analysis by the PhantomV AI core."}
                </p>
                <button
                    onClick={handleAnalyze}
                    className="w-full max-w-xs relative inline-flex items-center justify-center p-0.5 mt-4 overflow-hidden text-base font-bold rounded-lg group bg-gradient-to-br from-blue-600 to-fuchsia-600 hover:shadow-neon-blue"
                >
                    <span className="w-full relative px-5 py-3.5 transition-all ease-in duration-150 bg-gray-900 rounded-md group-hover:bg-opacity-0 text-white tracking-widest uppercase">
                        {buttonText}
                    </span>
                </button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl p-px bg-gradient-to-br from-blue-500 via-fuchsia-500 to-sky-500 rounded-2xl shadow-lg shadow-fuchsia-500/30"
            >
                <div className="relative bg-black/80 backdrop-blur-2xl rounded-2xl p-8">
                     <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                        <XCircleIcon className="h-8 w-8" />
                    </button>
                    <div className="min-h-[400px] flex items-center justify-center">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataAnalyzer;