import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import type { LucideIcon } from "lucide-react";

import {
  Home,
  MessageCircle,
  FileText,
  History,
  Sparkles,
  Upload,
  FileUp,
  Send,
  X,
  Check,
  Trash2,
  Clock3,
  Bot,
  ExternalLink,
  Menu,
  ChevronRight,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const API_URL = "https://askmypdf-backend-4enb.onrender.com/";

/* =========================================================
   TYPES
========================================================= */

type Message = {
  role: "user" | "assistant";
  text: string;
  sourceType?: "document" | "web" | "none";
  sources?: {
    title: string;
    url: string;
  }[];
};

type WorkspaceView =
  | "dashboard"
  | "chat"
  | "documents"
  | "history"
  | "assistant";

type HistoryItem = {
  id: string;
  fileName: string;
  fileType: "PDF" | "TXT";
  uploadedAt: string;
};

/* =========================================================
   NAVIGATION
========================================================= */

type NavItem = {
  id: WorkspaceView;
  label: string;
  icon: LucideIcon;
  target: string;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    target: "dashboard",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageCircle,
    target: "chat",
  },
  {
    id: "documents",
    label: "My Documents",
    icon: FileText,
    target: "documents",
  },
  {
    id: "history",
    label: "History",
    icon: History,
    target: "history",
  },
  {
    id: "assistant",
    label: "Smart Assistant",
    icon: Sparkles,
    target: "assistant",
  },
];

/* =========================================================
   MARKDOWN COMPONENT
========================================================= */

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="max-w-none text-sm leading-7 text-[#294F58]">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 text-xl font-bold text-[#063B46]">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 text-lg font-bold text-[#063B46]">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-[#075968]">
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p className="mb-3 leading-7 text-[#294F58]">{children}</p>
          ),

          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 text-[#294F58]">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 text-[#294F58]">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pl-1 leading-6">{children}</li>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-[#063B46]">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="text-[#075968]">{children}</em>
          ),

          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-[#00B8D9] bg-[#E8FAFD] px-4 py-2 text-[#416872]">
              {children}
            </blockquote>
          ),

          code: ({ children }) => (
            <code className="rounded bg-[#E8FAFD] px-1.5 py-0.5 text-sm text-[#075968]">
              {children}
            </code>
          ),

          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#008EAA] underline underline-offset-2 hover:text-[#063B46]"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

const App: React.FC = () => {
  /* -------------------------------------------------------
     DOCUMENT STATE
  ------------------------------------------------------- */

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [documentText, setDocumentText] = useState("");

  const [uploadedFileName, setUploadedFileName] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  /* -------------------------------------------------------
     AI STATE
  ------------------------------------------------------- */

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [isAsking, setIsAsking] = useState(false);

  const [summary, setSummary] = useState("");

  const [importantQuestions, setImportantQuestions] = useState("");

  const [isGeneratingSummary, setIsGeneratingSummary] =
    useState(false);

  const [isGeneratingQuestions, setIsGeneratingQuestions] =
    useState(false);

  /* -------------------------------------------------------
     HISTORY
  ------------------------------------------------------- */

  const [history, setHistory] = useState<HistoryItem[]>([]);

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const [activeView, setActiveView] =
    useState<WorkspaceView>("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =======================================================
     LOAD HISTORY FROM LOCAL STORAGE
  ======================================================= */

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(
        "askmypdf_history"
      );

      if (savedHistory) {
        const parsedHistory: HistoryItem[] =
          JSON.parse(savedHistory);

        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Could not load history:", error);
    }
  }, []);

  /* =======================================================
     SAVE HISTORY TO LOCAL STORAGE
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "askmypdf_history",
        JSON.stringify(history)
      );
    } catch (error) {
      console.error("Could not save history:", error);
    }
  }, [history]);

  /* =======================================================
     NAVIGATION FUNCTION
  ======================================================= */

  const goToView = (view: WorkspaceView) => {
    setActiveView(view);
    setMobileMenuOpen(false);

    const target =
      view === "assistant"
        ? document.getElementById("assistant")
        : document.getElementById(view);

    const fallback =
      document.getElementById("documents");

    const element = target || fallback;

    if (element) {
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  };

  /* =======================================================
     FILE SELECTION
  ======================================================= */

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isValid =
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".txt");

    if (!isValid) {
      alert("Only PDF and TXT files are allowed.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  /* =======================================================
     UPLOAD FILE
  ======================================================= */

  const handleUpload = async () => {
  if (!selectedFile) {
    alert("Please choose a PDF or TXT file first.");
    return;
  }

  setIsUploading(true);

  try {
    const formData = new FormData();

    formData.append("file", selectedFile);

    const response = await axios.post(
      `${API_URL}/api/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setDocumentText(response.data.text || "");

    setUploadedFileName(
      response.data.filename || selectedFile.name
    );

    setMessages([]);

    setSummary("");

    setImportantQuestions("");

    // Add file to history
    const fileType = selectedFile.name
      .toLowerCase()
      .endsWith(".pdf")
      ? "PDF"
      : "TXT";

    const historyItem: HistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      fileName: selectedFile.name,
      fileType,
      uploadedAt: new Date().toISOString(),
    };

    setHistory((previousHistory) => [
      historyItem,
      ...previousHistory.filter(
        (item) => item.fileName !== selectedFile.name
      ),
    ]);

    setSelectedFile(null);

    alert("File uploaded successfully!");

    goToView("documents");

  } catch (error: unknown) {

    console.error("Upload error:", error);

    if (axios.isAxiosError(error)) {

      if (error.response) {
        alert(
          error.response.data?.detail ||
          "The backend rejected the file. Please check the file and try again."
        );

      } else if (error.request) {
        alert(
          "Cannot connect to the backend. Please make sure FastAPI is running."
        );

      } else {
        alert(
          "Something went wrong while uploading the file."
        );
      }

    } else {
      alert(
        "An unexpected error occurred. Please try again."
      );
    }

  } finally {
    setIsUploading(false);
  }
};
  /* =======================================================
     REMOVE CURRENT DOCUMENT
  ======================================================= */

  const removeCurrentDocument = () => {
    setSelectedFile(null);
    setDocumentText("");
    setUploadedFileName("");
    setSummary("");
    setImportantQuestions("");
    setMessages([]);
  };

  /* =======================================================
     ASK AI
  ======================================================= */

  const handleAskQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    if (!documentText) {
      alert("Please upload a document first.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      text: trimmedQuestion,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setQuestion("");

    setIsAsking(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/chat`,
        {
          question: trimmedQuestion,
          document_text: documentText,
        }
      );

      const assistantMessage: Message = {
        role: "assistant",
        text:
          response.data.answer ||
          "I could not generate an answer.",
        sourceType: response.data.source_type,
        sources: response.data.sources || [],
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        role: "assistant",
        text:
          "Sorry, I could not process your question. Please check that the backend and Gemini API are running.",
        sourceType: "none",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        errorMessage,
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  /* =======================================================
     ENTER KEY FOR CHAT
  ======================================================= */

  const handleQuestionKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAskQuestion();
    }
  };

  /* =======================================================
     GENERATE SUMMARY
  ======================================================= */

  const handleGenerateSummary = async () => {
    if (!documentText) {
      alert("Please upload a document first.");
      return;
    }

    setIsGeneratingSummary(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/summary`,
        {
          document_text: documentText,
        }
      );

      setSummary(response.data.summary || "");
    } catch (error) {
      console.error("Summary error:", error);

      setSummary(
        "Could not generate the summary. Please try again."
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  /* =======================================================
     GENERATE IMPORTANT QUESTIONS
  ======================================================= */

  const handleGenerateQuestions = async () => {
    if (!documentText) {
      alert("Please upload a document first.");
      return;
    }

    setIsGeneratingQuestions(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/questions`,
        {
          document_text: documentText,
        }
      );

      setImportantQuestions(
        response.data.questions || ""
      );
    } catch (error) {
      console.error(
        "Important questions error:",
        error
      );

      setImportantQuestions(
        "Could not generate important questions. Please try again."
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  /* =======================================================
     CLEAR CHAT
  ======================================================= */

  const clearChat = () => {
    setMessages([]);
  };

  /* =======================================================
     DELETE HISTORY ITEM
  ======================================================= */

  const deleteHistoryItem = (id: string) => {
    setHistory((previousHistory) =>
      previousHistory.filter(
        (item) => item.id !== id
      )
    );
  };

  /* =======================================================
     CLEAR ALL HISTORY
  ======================================================= */

  const clearHistory = () => {
    if (history.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear your recent history?"
    );

    if (confirmed) {
      setHistory([]);
    }
  };

  /* =======================================================
     FORMAT HISTORY DATE
  ======================================================= */

  const formatHistoryDate = (date: string) => {
    const uploadedDate = new Date(date);

    const now = new Date();

    const difference =
      now.getTime() - uploadedDate.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} minute${
        minutes === 1 ? "" : "s"
      } ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      } ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${
        days === 1 ? "" : "s"
      } ago`;
    }

    return uploadedDate.toLocaleDateString();
  };

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const currentFileType = useMemo(() => {
    if (!uploadedFileName) return "";

    return uploadedFileName
      .toLowerCase()
      .endsWith(".pdf")
      ? "PDF"
      : "TXT";
  }, [uploadedFileName]);

  /* =======================================================
     NAV BUTTON
  ======================================================= */

  const NavigationButton = ({
    item,
  }: {
    item: NavItem;
  }) => {
    const Icon = item.icon;

    const isActive = activeView === item.id;

    return (
      <button
        type="button"
        onClick={() => goToView(item.id)}
        className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
          isActive
            ? "bg-[#00B8D9] text-white shadow-sm"
            : "text-[#416872] hover:bg-[#E8FAFD] hover:text-[#063B46]"
        }`}
      >
        <Icon
          size={19}
          strokeWidth={isActive ? 2.3 : 2}
        />

        <span>{item.label}</span>

        {isActive && (
          <ChevronRight
            size={16}
            className="ml-auto"
          />
        )}
      </button>
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-screen overflow-hidden bg-[#E8FAFD] text-[#082F38]">
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="flex h-[72px] items-center justify-between border-b border-[#D8F3F7] bg-white px-4 sm:px-6 lg:px-8">
        {/* Brand */}

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#063B46] text-white shadow-sm">
            <Sparkles size={20} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-[#063B46] sm:text-lg">
              AskMyPDF AI
            </h1>

            <p className="hidden text-xs text-[#66858D] sm:block">
              Chat with your documents
            </p>
          </div>
        </div>

        {/* Header status */}

        <div className="hidden items-center gap-2 rounded-full border border-[#D8F3F7] bg-[#F8FEFF] px-3 py-2 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span className="text-xs font-medium text-[#416872]">
            AI Assistant Online
          </span>
        </div>

        {/* Mobile menu */}

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              (previousValue) => !previousValue
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8F3F7] bg-white text-[#063B46] lg:hidden"
          aria-label="Open navigation"
        >
          {mobileMenuOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </header>

      {/* ===================================================
          MOBILE NAVIGATION
      =================================================== */}

      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-[72px] z-50 border-b border-[#D8F3F7] bg-white p-3 shadow-lg lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <NavigationButton
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===================================================
          BODY
      =================================================== */}

      <div className="flex h-[calc(100vh-72px)] overflow-hidden">
        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-[#D8F3F7] bg-[#F8FEFF] p-4 lg:block">
          <div className="flex h-full flex-col">
            {/* Workspace title */}

            <div className="mb-5 px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#66858D]">
                Workspace
              </p>

              <p className="mt-1 text-sm text-[#416872]">
                Manage your documents
              </p>
            </div>

            {/* Navigation */}

            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <NavigationButton
                  key={item.id}
                  item={item}
                />
              ))}
            </nav>

            {/* Spacer */}

            <div className="flex-1" />

            {/* System status */}

            <div className="rounded-2xl border border-[#D8F3F7] bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <span className="text-xs font-semibold text-[#063B46]">
                  System Ready
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#66858D]">
                Upload a document to start asking questions
                and using AI tools.
              </p>
            </div>
          </div>
        </aside>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
          {/* ===============================================
              MOBILE WORKSPACE NAV
          =============================================== */}

          <div className="mb-6 overflow-x-auto lg:hidden">
            <div className="flex min-w-max gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToView(item.id)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                      activeView === item.id
                        ? "border-[#00B8D9] bg-[#00B8D9] text-white"
                        : "border-[#D8F3F7] bg-white text-[#416872]"
                    }`}
                  >
                    <Icon size={15} />

                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===============================================
              DASHBOARD / HERO
          =============================================== */}

          <section
            id="dashboard"
            className="scroll-mt-6"
          >
            <div className="flex flex-col gap-5 rounded-3xl border border-[#D8F3F7] bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8FAFD] px-3 py-1.5 text-xs font-semibold text-[#075968]">
                  <Sparkles size={14} />

                  AI DOCUMENT ASSISTANT
                </div>

                <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#063B46] sm:text-3xl lg:text-4xl">
                  Understand your documents with AI.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-[#66858D] sm:text-base">
                  Upload your PDF or TXT file, ask questions,
                  generate summaries, and prepare important
                  questions from your study material.
                </p>
              </div>

              {/* Current document */}

              <div className="w-full rounded-2xl border border-[#D8F3F7] bg-[#F8FEFF] p-4 sm:max-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                    <FileText size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#66858D]">
                      Current document
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-[#063B46]">
                      {uploadedFileName ||
                        "No document uploaded"}
                    </p>
                  </div>
                </div>

                {uploadedFileName && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                    <Check size={14} />

                    <span>Ready for AI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Feature cards */}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#D8F3F7] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                  <MessageCircle size={19} />
                </div>

                <h3 className="mt-4 font-semibold text-[#063B46]">
                  Ask Questions
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#66858D]">
                  Ask questions about the content of your
                  uploaded document.
                </p>
              </div>

              <div className="rounded-2xl border border-[#D8F3F7] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                  <BookOpen size={19} />
                </div>

                <h3 className="mt-4 font-semibold text-[#063B46]">
                  Smart Summary
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#66858D]">
                  Generate a simple summary of lengthy
                  documents using AI.
                </p>
              </div>

              <div className="rounded-2xl border border-[#D8F3F7] bg-white p-5 sm:col-span-2 lg:col-span-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                  <Sparkles size={19} />
                </div>

                <h3 className="mt-4 font-semibold text-[#063B46]">
                  Exam Questions
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#66858D]">
                  Create important revision and exam
                  questions from your document.
                </p>
              </div>
            </div>
          </section>

          {/* ===============================================
              DOCUMENTS / UPLOAD
          =============================================== */}

          <section
            id="documents"
            className="scroll-mt-6 pt-7"
          >
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#063B46] to-[#075968] p-5 shadow-sm sm:p-7 lg:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#8EEAF5]">
                    <Upload size={18} />

                    <span className="text-xs font-bold uppercase tracking-[0.16em]">
                      Upload Document
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                    Start with your study material
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#BCEBF1]">
                    Upload a PDF or TXT file and use AskMyPDF
                    AI to understand it faster.
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    PDF
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    TXT
                  </span>
                </div>
              </div>

              {/* Upload area */}

              <div className="mt-6 rounded-2xl border border-dashed border-[#5BD8E8] bg-white p-4 sm:p-6">
                {!selectedFile ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-[#D8F3F7] bg-[#F8FEFF] px-4 py-8 text-center transition hover:bg-[#E8FAFD] sm:py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8FAFD] text-[#075968]">
                      <FileUp size={26} />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#063B46] sm:text-base">
                      Choose a document
                    </h3>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-[#66858D] sm:text-sm">
                      Select a PDF or TXT file from your
                      computer.
                    </p>

                    <span className="mt-5 inline-flex items-center rounded-xl bg-[#00B8D9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
                      Browse Files
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="rounded-2xl border border-[#D8F3F7] bg-white p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                          <FileText size={22} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#063B46]">
                            {selectedFile.name}
                          </p>

                          <p className="mt-1 text-xs text-[#66858D]">
                            {(
                              selectedFile.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB • Ready to upload
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFile(null)
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-[#D8F3F7] text-[#66858D] transition hover:bg-[#E8FAFD] hover:text-[#063B46] sm:self-auto"
                        aria-label="Remove selected file"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B8D9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#009FBB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw
                            size={17}
                            className="animate-spin"
                          />

                          Uploading...
                        </>
                      ) : (
                        <>
                          <Sparkles size={17} />

                          Upload & Analyze
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Current uploaded file */}

              {uploadedFileName && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#8EEAF5]">
                      <Check size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-[#BCEBF1]">
                        Uploaded document
                      </p>

                      <p className="truncate text-sm font-semibold text-white">
                        {uploadedFileName}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeCurrentDocument}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
                  >
                    <X size={15} />

                    Remove
                  </button>
                </div>
              )}

              {/* =================================================
                  SMART ASSISTANT TOOLS
              ================================================= */}

              <div
                id="assistant"
                className="scroll-mt-6 mt-6"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={
                      !documentText ||
                      isGeneratingSummary
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#063B46] transition hover:bg-[#E8FAFD] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingSummary ? (
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <BookOpen size={17} />
                    )}

                    {isGeneratingSummary
                      ? "Generating..."
                      : "Generate Summary"}
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={
                      !documentText ||
                      isGeneratingQuestions
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingQuestions ? (
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Sparkles size={17} />
                    )}

                    {isGeneratingQuestions
                      ? "Generating..."
                      : "Important Questions"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================
              SUMMARY
          =============================================== */}

          {summary && (
            <section className="pt-7">
              <div className="rounded-3xl border border-[#D8F3F7] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                    <BookOpen size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66858D]">
                      AI Tool
                    </p>

                    <h2 className="text-lg font-bold text-[#063B46]">
                      Document Summary
                    </h2>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F1FCFE] p-4 sm:p-6">
                  <MarkdownContent content={summary} />
                </div>
              </div>
            </section>
          )}

          {/* ===============================================
              IMPORTANT QUESTIONS
          =============================================== */}

          {importantQuestions && (
            <section className="pt-7">
              <div className="rounded-3xl border border-[#D8F3F7] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66858D]">
                      AI Tool
                    </p>

                    <h2 className="text-lg font-bold text-[#063B46]">
                      Important Questions
                    </h2>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#F1FCFE] p-4 sm:p-6">
                  <MarkdownContent
                    content={importantQuestions}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ===============================================
              HISTORY
          =============================================== */}

          <section
            id="history"
            className="scroll-mt-6 pt-7"
          >
            <div className="rounded-3xl border border-[#D8F3F7] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                    <History size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#66858D]">
                      Workspace
                    </p>

                    <h2 className="text-lg font-bold text-[#063B46]">
                      Recent History
                    </h2>
                  </div>
                </div>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 size={14} />

                    Clear History
                  </button>
                )}
              </div>

              {/* Empty history */}

              {history.length === 0 ? (
                <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-[#F1FCFE] px-5 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#66858D] shadow-sm">
                    <History size={24} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-[#063B46]">
                    No recent documents
                  </h3>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-[#66858D]">
                    Uploaded files will automatically appear
                    here and will remain available after a
                    browser refresh.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-3 rounded-2xl border border-[#D8F3F7] bg-[#F8FEFF] p-4 transition hover:border-[#9DE7F0] hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8FAFD] text-[#075968]">
                          <FileText size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#063B46]">
                            {item.fileName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#66858D]">
                            <span>{item.fileType}</span>

                            <span>•</span>

                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={12} />

                              {formatHistoryDate(
                                item.uploadedAt
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView("documents");

                            document
                              .getElementById("documents")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8F3F7] bg-white px-3 py-2 text-xs font-semibold text-[#075968] transition hover:bg-[#E8FAFD]"
                        >
                          View
                          <ChevronRight size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteHistoryItem(item.id)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-white text-red-400 transition hover:bg-red-50"
                          aria-label={`Delete ${item.fileName} from history`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F8FEFF] p-3">
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0 text-[#66858D]"
                />

                <p className="text-xs leading-5 text-[#66858D]">
                  Recent History is stored in your browser's
                  local storage. No database is required.
                </p>
              </div>
            </div>
          </section>

          {/* ===============================================
              CHAT
          =============================================== */}

          <section
            id="chat"
            className="scroll-mt-6 pt-7"
          >
            <div className="overflow-hidden rounded-3xl border border-[#D8F3F7] bg-white shadow-sm">
              {/* Chat header */}

              <div className="flex flex-col gap-3 bg-gradient-to-r from-[#063B46] to-[#075968] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#8EEAF5]">
                    <Bot size={22} />
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      AskMyPDF Assistant
                    </h2>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />

                      <span className="text-xs text-[#BCEBF1]">
                        {uploadedFileName
                          ? `Ready • ${currentFileType}`
                          : "Upload a document to start"}
                      </span>
                    </div>
                  </div>
                </div>

                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 sm:self-auto"
                  >
                    <RefreshCw size={14} />

                    Clear Chat
                  </button>
                )}
              </div>

              {/* Messages */}

              <div className="min-h-[350px] max-h-[560px] overflow-y-auto bg-[#F1FCFE] p-4 sm:p-6 lg:p-7">
                {messages.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center px-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#075968] shadow-sm">
                      <MessageCircle size={27} />
                    </div>

                    <h3 className="mt-5 text-base font-bold text-[#063B46] sm:text-lg">
                      Ask anything about your document
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-[#66858D]">
                      {uploadedFileName
                        ? "Ask a question below and AskMyPDF AI will first check your uploaded document."
                        : "Upload a PDF or TXT document above, then come here to ask questions."}
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {[
                        "Summarize this document",
                        "What are the main topics?",
                        "Explain the important concepts",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setQuestion(suggestion);
                          }}
                          className="rounded-full border border-[#D8F3F7] bg-white px-3 py-2 text-xs font-medium text-[#416872] transition hover:border-[#9DE7F0] hover:text-[#063B46]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((msg, index) => (
                      <div
                        key={`${msg.role}-${index}`}
                        className={`flex min-w-0 gap-3 ${
                          msg.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#063B46] text-white">
                            <Sparkles size={16} />
                          </div>
                        )}

                        <div
                          className={`min-w-0 max-w-[88%] rounded-2xl p-4 sm:max-w-[80%] ${
                            msg.role === "user"
                              ? "rounded-br-md bg-[#00B8D9] text-white"
                              : "rounded-bl-md border border-[#D8F3F7] bg-white"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-wrap text-sm leading-7 text-white">
                              {msg.text}
                            </p>
                          ) : (
                            <>
                              <MarkdownContent
                                content={msg.text}
                              />

                              {/* Web sources */}

                              {msg.sourceType ===
                                "web" &&
                                msg.sources &&
                                msg.sources.length >
                                  0 && (
                                  <div className="mt-4 border-t border-[#D8F3F7] pt-4">
                                    <p className="mb-2 text-xs font-semibold text-[#063B46]">
                                      Sources
                                    </p>

                                    <div className="space-y-2">
                                      {msg.sources.map(
                                        (
                                          source,
                                          sourceIndex
                                        ) => (
                                          <a
                                            key={`${source.url}-${sourceIndex}`}
                                            href={
                                              source.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 rounded-lg bg-[#F8FEFF] px-3 py-2 text-xs text-[#075968] transition hover:bg-[#E8FAFD]"
                                          >
                                            <ExternalLink
                                              size={13}
                                              className="shrink-0"
                                            />

                                            <span className="truncate">
                                              {
                                                source.title
                                              }
                                            </span>
                                          </a>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </>
                          )}
                        </div>

                        {msg.role === "user" && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#075968] text-white">
                            <span className="text-xs font-bold">
                              You
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {isAsking && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#063B46] text-white">
                          <Sparkles size={16} />
                        </div>

                        <div className="rounded-2xl rounded-bl-md border border-[#D8F3F7] bg-white px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-[#00B8D9]" />

                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-[#00B8D9]"
                              style={{
                                animationDelay:
                                  "120ms",
                              }}
                            />

                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-[#00B8D9]"
                              style={{
                                animationDelay:
                                  "240ms",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat input */}

              <div className="border-t border-[#D8F3F7] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2 rounded-2xl border border-[#CBEAF0] bg-[#F8FEFF] p-2 focus-within:border-[#00B8D9]">
                  <input
                    type="text"
                    value={question}
                    onChange={(event) =>
                      setQuestion(event.target.value)
                    }
                    onKeyDown={handleQuestionKeyDown}
                    placeholder={
                      uploadedFileName
                        ? "Ask a question about your document..."
                        : "Upload a document first..."
                    }
                    disabled={
                      !uploadedFileName || isAsking
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#063B46] outline-none placeholder:text-[#8BA5AB] disabled:cursor-not-allowed"
                  />

                  <button
                    type="button"
                    onClick={handleAskQuestion}
                    disabled={
                      !question.trim() ||
                      !uploadedFileName ||
                      isAsking
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00B8D9] text-white transition hover:bg-[#009FBB] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send question"
                  >
                    <Send size={18} />
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-2 text-xs text-[#66858D] sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Press Enter to send your question.
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-500" />

                    Document context enabled
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================
              FOOTER
          =============================================== */}

          <footer className="pb-6 pt-8 text-center">
            <p className="text-xs text-[#66858D]">
              AskMyPDF AI • AI-powered document assistant
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;