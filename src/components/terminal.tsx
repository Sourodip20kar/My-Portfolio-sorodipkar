// src/components/terminal.tsx
import { AnimatePresence, motion } from "motion/react";
import type { PanInfo } from "motion/react";
import clsx from "clsx";
import { useState, useRef, useEffect, useCallback } from "react";
import TypingAnimation from "./TypingAnimation";
import { type HistoryItem } from "./types";
import LiquidTerminalIcon from "./LiquidTerminalIcon";
import Celebration from "./Celebration";
import Notification from "./Notification"; // Import the new Notification component

type NotificationState = {
  message: string;
  subMessage: string;
  type: 'email' | 'phone' | null;
};

type TerminalProps = {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Terminal({ isOpen, onClose, history, setHistory, loading, setLoading }: TerminalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [dragKey, setDragKey] = useState(0);
  const [wasClearedByUser, setWasClearedByUser] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]); 
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ message: '', subMessage: '', type: null });

  // Audio setup for terminal opening sound
    // Audio setup for key press sound
    const keyAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      // Preload the key press sound
      const keyAudio = new Audio('/granted.wav');
      keyAudio.preload = 'auto';
      keyAudio.volume = 0.5;
      keyAudioRef.current = keyAudio;
      return () => {
        keyAudioRef.current = null;
      };
    }, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create and preload the audio
    const audio = new Audio('/expand.wav');
    audio.preload = 'auto';
    audio.volume = 0.7; // Adjust volume as needed
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Play sound when terminal opens
  useEffect(() => {
    if (isOpen && !isMinimized && audioRef.current) {
      const playExpandSound = async () => {
        try {
          
          audioRef.current!.currentTime = 0; // Reset to beginning
          await audioRef.current!.play();
        } catch (err) {
          console.error('', err);
          // Try alternative path
          try {
            const altAudio = new Audio('./expand.wav');
            altAudio.volume = 0.7;
            await altAudio.play();
            
          } catch (altErr) {
            console.error(altErr);
          }
        }
      };
      
      // Sync with animation - play sound when animation starts
      playExpandSound();
    }
  }, [isOpen, isMinimized]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsExploding(true);
      const isEmail = text.includes('@');
      setNotification({
        message: 'Copied to clipboard!',
        subMessage: isEmail ? `${text} copied successfully.` : 'Phone number copied successfully.',
        type: isEmail ? 'email' : 'phone',
      });
      setTimeout(() => setNotification({ message: '', subMessage: '', type: null }), 4000);
    });
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const onAnimationComplete = useCallback(() => {
    setLoading(false);
    setHistory(prev => 
        prev.map((item, index) => 
            index === prev.length - 1 && !item.completed 
                ? { ...item, completed: true } 
                : item
        )
    );
  }, [setLoading, setHistory]);

  useEffect(() => {
    if (isOpen && history.length === 0 && !wasClearedByUser) {
      setLoading(true);
      setHistory([
        {
          id: crypto.randomUUID(),
          command: "welcome",
          output: "Hi, I'm Sourodip Kar, a Software & AI Engineer.\n\nWelcome to my interactive portfolio terminal!\nType 'help' to see available commands.",
          completed: false,
        },
      ]);
    }
  }, [isOpen, history.length, wasClearedByUser]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  useEffect(() => {
    if (!isOpen) {
      setWasClearedByUser(false);
    }
  }, [isOpen]);

  const maximized = isMaximized || isSmallScreen;
  const parentRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isSmallScreen) return;
    const topSnapThreshold = 50;
    const downDragThreshold = 50;

    if (!isMaximized && info.point.y < topSnapThreshold) {
      setIsMaximized(true);
      setDragKey(prev => prev + 1); 
    } else if (isMaximized && info.offset.y > downDragThreshold) {
      setIsMaximized(false);
      setDragKey(prev => prev + 1);
    }
  };

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Play key sound for every key press except for system keys
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && keyAudioRef.current) {
      try {
        keyAudioRef.current.currentTime = 0;
        keyAudioRef.current.play();
      } catch (err) {
        // Ignore audio errors
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        if (inputRef.current) {
          inputRef.current.value = commandHistory[newIndex];
        }
      }
      return;
    }
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        } else {
          setHistoryIndex(newIndex);
          if (inputRef.current) {
            inputRef.current.value = commandHistory[newIndex];
          }
        }
      }
      return;
    }

    if (e.key !== "Enter" && historyIndex !== -1) {
      setHistoryIndex(-1);
    }

    if (e.key !== "Enter" || loading) return;

    const input = e.currentTarget.value.trim().toLowerCase();
    if (!input) return;
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    const commands: { [key: string]: string } = {
        help:
`Available commands:
  about           - Learn about me
  education       - My academic background
  experience      - My work experience
  projects        - A look at my works
  skills          - Languages and tools
  contact         - Let's connect
  certifications  - My certifications
  leadership      - Leadership and initiatives
  clear           - Clear the screen

Type any command to continue...`,
      about:
`🙋‍♂️Hello, I'm Sourodip Kar!

I'm a Software Developer specializing in full-stack development, artificial intelligence & machine learning, computer vision, and scalable cloud infrastructure.

Background:
- Currently a Computer Vision & Machine Learning Intern at the Space Applications Center (SAC), ISRO, working with the Scientific Research and Training Division (SRTD).
- Passionate about building scalable systems, intelligent automation, and intuitive data visualization tools.
- Proficient in Python, Java, Spring Boot, Microservices, AWS, GCP, and seamlessly integrating AI into real-world applications.

Feel free to explore more using the 'projects', 'skills', or 'contact' commands!
You can also learn more on the [About page](/about).👈`,
      projects:
`🚀 Projects:

MindfulLibrary
AI-powered semantic book recommender based on mood, tone, and interests
Technologies: Python, Pandas, NumPy, TF-IDF, NLP, Gradio
Link: [GitHub](https://github.com/Sourodip20kar/MindfulLibrary)

Chicken Disease Classification
Web app for detecting chicken disease (coccidiosis in poultry) from fecal images using deep learning
Technologies: Python, Deep Learning, Docker, AWS, DVC, Streamlit
Link: [GitHub](https://github.com/Sourodip20kar/Chicken-Disease-Classification)

Image Inpainting Tool
Desktop GUI to apply stable diffusion inpainting using image segmentation
Technologies: Python, OpenCV, PyQt5, GrabCut, Stable Diffusion
Link: [GitHub](https://github.com/Sourodip20kar/Image-Inpainting-with-grabcut-and-stablediffusion-)

Solar Panel Detection & Segmentation (ISRO SAC)
Two-stage CV pipeline using YOLOv11 & SAM for rooftop solar panel mapping from satellite images
Technologies: YOLOv11, SAM, Python, PyTorch, GeoPandas, Rasterio, OpenCV
(Confidential – Part of internship at SAC, ISRO)

Type 'contact' to connect or discuss collaborations!`,
      education: `🎓 Education:

B.Tech in Computer Science & Engineering (AI & ML)
Narula Institute of Technology, West Bengal
Duration: Sept 2021 – June 2025
CGPA: 8.14
Coursework included a strong foundation in core computer science subjects such as Data Structures & Algorithms (DSA), Operating Systems (OS), Computer Networks, Databases, Digital Logic Design, Compiler Design (CD), Theory of Computation (TOC), Linear Algebra, Discrete Mathematics, and Probability & Statistics.
Specialized training in Artificial Intelligence, Machine Learning, Natural Language Processing (NLP), and Computer Vision.

Higher Secondary (Class XII) – CISCE
St. Augustine Day School, Barrackpore
Year: 2021
Percentage: 83.2%
Focused on core science subjects including Physics, Chemistry, and Mathematics.

Secondary (Class X) – CISCE
St. Claret School, Debpukur
Year: 2019
Percentage: 85%
Developed early interest in computational thinking and logical reasoning.

📚 Additional Learning:

- Continuous professional development through certifications
- Self-guided study in cloud technologies, full-stack development, and AI & ML
- Regular participation in hackathons, coding competitions, and research paper publications

Type 'experience' or 'certifications' to continue exploring my journey.`,
      experience:`💼 Work Experience:

Computer Vision & Machine Learning Intern
Space Applications Center (SAC), ISRO – Ahmedabad
Duration: March 2025 – Present

- Built a two-stage pipeline using YOLOv11 and SAM for solar panel detection & segmentation on satellite imagery.
- Fine-tuned models on regional data to improve accuracy and handle geographic variation.
- Integrated geospatial tools (OpenCV, Rasterio, GeoPandas) for precise overlay and analysis.
- Improved detection mAP from 0.711 → 0.901 and segmentation IoU from 0.697 → 0.891.

Type 'projects' to check them out or 'skills' to view my toolkit.`,
      certifications:`📜 Certifications:

Tech & Domain-Specific Certifications:

- MongoDB Aggregation Framework – Coursera
- Machine Learning with Python – Coursera
- Cloud Fundamentals (GCP) – Google Cloud Platform
- Full-Stack Web Development – Ardent Computech
- Geocomputation & Geo-web Services – ISRO

Specialized Programs:

[Computer Vision and Pattern Recognition (CVPR)](https://drive.google.com/file/d/1QrE78ywparrBxsrb5q4o-CluDd5R1f-6/view?usp=sharing)
RCC Institute of Information Technology, Kolkata
100-hour training program (Jul – Oct 2024), under MeitY Grants-in-Aid Project
(Govt. of India initiative for capacity building in emerging ICT domains)

[Cybersecurity Virtual Internship](https://drive.google.com/file/d/1yqChG1LFhHDXkRBMGRv313oVn6kbSkDK/view?usp=sharing)
AICTE x Edunet Foundation
6-week internship program (Jan – Feb 2025) focused on Cybersecurity fundamentals and hands-on learning`,
      leadership:`🌟 Leadership & Extracurriculars:

Finalist – ISRO Bharatiya Antariksh Hackathon 2024 & Smart Bengal Hackathon 2023
Recognized for AI-driven solutions in space-tech, smart governance, and urban innovation.

2× IEEE Xplore Author (2024 & 2025)
Published research on:
▸ [Enhancing Diagnostic Accuracy for Kidney Abnormalities through Resolution-Optimized Deep Learning Models](https://ieeexplore.ieee.org/document/10919453)
▸ [Exploring Geospatial Mapping through Speech Commands](https://ieeexplore.ieee.org/abstract/document/10940999)

Student Ambassador – Idea-o-meter, Narula Institute of Technology

Student Member – Institution of Electronics and Telecommunication Engineers (IETE)`,
      skills: `🛠️ Skills:

Languages:
Python, Java, C, SQL, JavaScript, React, TypeScript, HTML5, CSS3

Frameworks & Libraries:
Spring Boot, TensorFlow, Keras, PyTorch, Scikit-learn, OpenCV, NumPy, Pandas, Matplotlib

Databases:
MongoDB, PostgreSQL, MySQL

Cloud & DevOps:
Amazon Web Services (AWS), Google Cloud Platform (GCP), Docker, Git, GitHub, CI/CD

Tools & Platforms:
Jupyter, REST APIs, VS Code, Linux, DVC, Gradio, Streamlit, PyQt

Domains:
AI/ML, Computer Vision, Natural Language Processing (NLP), Full-Stack Development, Geospatial Analysis.`,
      contact: `📬 Get In Touch:

Email: COPY{51.sourodipkar2002n.i.t@gmail.com} / COPY{sourodipkar2002@gmail.com}
Phone: COPY{+91 62917-65291}
GitHub: [@Sourodip20kar](https://github.com/Sourodip20kar)
LinkedIn: [/in/sourodip20kar](https://www.linkedin.com/in/sourodip20kar/)
Twitter (X): [@SourodipKar](https://x.com/SourodipKar)
Instagram: [@sourodipkar](https://www.instagram.com/sourodipkar/)

Feel free to reach out!
You can also learn more on the [Contacts page](/contact).👈`
    };

    setLoading(true);
    e.currentTarget.value = "";

    if (input === "clear") {
      setHistory([]);
      setWasClearedByUser(true);
      setLoading(false);
    } else if (input in commands) {
      setHistory((prev) => [
        ...prev,
        { id: crypto.randomUUID(), command: input, output: commands[input], completed: false },
      ]);
    } else {
      const notFoundMessage = `bash: ${input}: command not found`;
      setHistory((prev) => [
        ...prev,
        { id: crypto.randomUUID(), command: input, output: notFoundMessage, completed: false },
      ]);
    }
  };

  const parseOutput = (output: string) => {
    const copyIconHtml = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="inline-block ml-1 text-zinc-400 group-hover:text-zinc-100 transition-colors"><path d="M19.53 8L14 2.47C13.8595 2.32931 13.6688 2.25018 13.47 2.25H11C10.2707 2.25 9.57118 2.53973 9.05546 3.05546C8.53973 3.57118 8.25 4.27065 8.25 5V6.25H7C6.27065 6.25 5.57118 6.53973 5.05546 7.05546C4.53973 7.57118 4.25 8.27065 4.25 9V19C4.25 19.7293 4.53973 20.4288 5.05546 20.9445C5.57118 21.4603 6.27065 21.75 7 21.75H14C14.7293 21.75 15.4288 21.4603 15.9445 20.9445C16.4603 20.4288 16.75 19.7293 16.75 19V17.75H17C17.7293 17.75 18.4288 17.4603 18.9445 16.9445C19.4603 16.4288 19.75 15.7293 19.75 15V8.5C19.7421 8.3116 19.6636 8.13309 19.53 8ZM14.25 4.81L17.19 7.75H14.25V4.81ZM15.25 19C15.25 19.3315 15.1183 19.6495 14.8839 19.8839C14.6495 20.1183 14.3315 20.25 14 20.25H7C6.66848 20.25 6.35054 20.1183 6.11612 19.8839C5.8817 19.6495 5.75 19.3315 5.75 19V9C5.75 8.66848 5.8817 8.35054 6.11612 8.11612C6.35054 7.8817 6.66848 7.75 7 7.75H8.25V15C8.25 15.7293 8.53973 16.4288 9.05546 16.9445C9.57118 17.4603 10.2707 17.75 11 17.75H15.25V19ZM17 16.25H11C10.6685 16.25 10.3505 16.1183 10.1161 15.8839C9.8817 15.6495 9.75 15.3315 9.75 15V5C9.75 4.66848 9.8817 4.35054 10.1161 4.11612C10.3505 3.8817 10.6685 3.75 11 3.75H12.75V8.5C12.7526 8.69811 12.8324 8.88737 12.9725 9.02747C13.1126 9.16756 13.3019 9.24741 13.5 9.25H18.25V15C18.25 15.3315 18.1183 15.6495 17.8839 15.8839C17.6495 16.1183 17.3315 16.25 17 16.25Z" fill="currentColor"/></svg>`;
    return output
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const isExternal = url.startsWith('http') || url.startsWith('mailto:');
        return isExternal 
          ? `<a href="${url}" class="text-[#4facfe] underline hover:text-blue-300 cursor-pointer" target="_blank" rel="noopener noreferrer">${text}</a>`
          : `<a href="${url}" class="text-[#4facfe] underline hover:text-blue-300 cursor-pointer">${text}</a>`;
      })
      .replace(/COPY\{([^}]+)\}/g, `<span class="copyable group cursor-pointer" data-copy="$1">$1${copyIconHtml}</span>`);
  };

  return (
    <>
      <Celebration isExploding={isExploding} onComplete={() => setIsExploding(false)} />
      <Notification {...notification} onClose={() => setNotification({ message: '', subMessage: '', type: null })} />
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            ref={parentRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-md bg-zinc-900/20"
          >
            <motion.div
                key={`${isMaximized ? "maximized" : "normal"}-${dragKey}`}
                drag={!isSmallScreen}
                dragConstraints={parentRef}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                initial={{ 
                  opacity: 0,
                  scaleY: 0.01, // Start as a thin line
                  width: maximized ? "100%" : "960px",
                  height: maximized ? "100%" : "500px",
                  top: maximized ? 0 : "50%",
                  left: maximized ? 0 : "50%",
                  x: maximized ? 0 : "-50%",
                  y: maximized ? 0 : "-50%"
                }}
                animate={{ 
                  opacity: 1,
                  scaleY: 1, // Animate to full height
                  width: maximized ? "100%" : "960px",
                  height: maximized ? "100%" : "500px",
                  top: maximized ? 0 : "50%",
                  left: maximized ? 0 : "50%",
                  x: maximized ? 0 : "-50%",
                  y: maximized ? 0 : "-50%",
                  transition: {
                    opacity: { duration: 0.3 },
                    scaleY: { 
                      duration: 0.5,
                      delay: 0.2,
                      ease: "easeOut"
                    },
                    default: { duration: 0.3 }
                  }
                }}
                exit={{ 
                  opacity: 0,
                  scaleY: 0.01, // Shrink back on close
                  transition: {
                    opacity: { 
                      duration: 0.3,
                      delay: 0.1 // Slight delay so the shrinking is visible before fade
                    },
                    scaleY: { 
                      duration: 0.4,
                      ease: "easeInOut"
                    }
                  }
                }}
                className={clsx(
                  "bg-zinc-800 shadow-xl flex flex-col",
                  maximized ? "fixed inset-0" : "absolute"
                )}
                style={{
                  borderRadius: "0px",
                  clipPath: "none",
                }}
              >
                <div
                  className={clsx(
                    "flex justify-between items-center bg-zinc-700 p-2",
                    !isSmallScreen && "cursor-grab active:cursor-grabbing"
                  )}
                  style={{
                    borderRadius: "0px",
                  }}
                >
                  <div className="flex gap-2 terminal-controls">
                    <button
                      onClick={() => {
                        setHistory([]);
                        onClose();
                      }}
                      className="size-4 rounded-full bg-red-500 hover:bg-red-600"
                      title="Close"
                    ></button>
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="size-4 rounded-full bg-yellow-500 hover:bg-yellow-600"
                      title="Minimize"
                    ></button>
                    <button
                      onClick={() => {
                        setIsMaximized((prev) => !prev);
                        setDragKey(prev => prev + 1);
                      }}
                      className="size-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={maximized ? "Restore" : "Maximize"}
                      disabled={isSmallScreen}
                    ></button>
                  </div>
                  <span className="text-zinc-300 text-sm select-none">
                    &lt;sourodip/kar&gt;
                  </span>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 bg-zinc-800">
                    <div
                      className={clsx(
                        "text-[#57af6d] border-b border-[#57af6d] pb-1",
                        isSmallScreen ? "text-xs leading-tight" : "text-sm flex-wrap"
                      )}
                    >
                      {isSmallScreen ? (
                        <p>help | about | education | experience | projects | skills | contact | certifications | leadership | clear</p>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span>help</span>
                          <span>|</span>
                          <span>about</span>
                          <span>|</span>
                          <span>education</span>
                          <span>|</span>
                          <span>experience</span>
                          <span>|</span>
                          <span>projects</span>
                          <span>|</span>
                          <span>skills</span>
                          <span>|</span>
                          <span>contact</span>
                          <span>|</span>
                          <span>certifications</span>
                          <span>|</span>
                          <span>leadership</span>
                          <span>|</span>
                          <span>clear</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    ref={terminalBodyRef}
                    className={clsx(
                      "flex-1 p-4 pt-0 text-zinc-100 font-mono overflow-auto scrollbar-hide",
                      isSmallScreen ? "text-xs" : "text-sm"
                    )}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      const copyable = target.closest('.copyable');

                      if (target.tagName === 'A') {
                        const href = target.getAttribute('href');
                        if (href && href.startsWith('/')) {
                          setIsMinimized(true);
                          return;
                        }
                      }
                      
                      if (copyable && copyable instanceof HTMLElement) {
                        handleCopyToClipboard(copyable.dataset.copy || '');
                      } else {
                        inputRef.current?.focus();
                      }
                    }}
                  >
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className={clsx(
                          "mt-2 whitespace-pre-wrap",
                          isSmallScreen ? "text-xs leading-relaxed" : "text-sm"
                        )}
                      >
                        <p>
                          <span className="text-[#4facfe]">sourodip@portfolio:~$</span> {item.command}
                        </p>
                        {history.indexOf(item) === history.length - 1 && !item.completed ? (
                          <TypingAnimation
                            text={item.output}
                            scrollRef={terminalBodyRef}
                            onCompleted={onAnimationComplete}
                          />
                        ) : (
                          <div 
                            dangerouslySetInnerHTML={{ __html: parseOutput(item.output) }}
                          />
                        )}
                      </div>
                    ))}

                    {!loading && (
                      <div
                        className={clsx(
                          "flex mt-2",
                          isSmallScreen ? "text-xs" : "text-sm"
                        )}
                      >
                        <span className="text-[#4facfe]">sourodip@portfolio:~$</span>
                        <input
                          ref={inputRef}
                          id="terminal-input"
                          name="terminal-command"
                          type="text"
                          className={clsx(
                            "flex-1 bg-transparent border-none outline-none text-zinc-100 pl-2",
                            isSmallScreen ? "text-xs" : "text-sm"
                          )}
                          onKeyDown={handleInput}
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
          </motion.div>
        )}
        {isOpen && isMinimized && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsMinimized(false)}
            className={clsx(
              "fixed left-1/2 bottom-4 -translate-x-1/2 px-5 py-2 w-fit text-base transition-all duration-300 ease-in-out whitespace-nowrap audiowide-regular cyber-cut-terminal z-40 flex items-center justify-center font-normal cursor-pointer",
              "text-zinc-900 bg-zinc-100 hover:shadow-[0_0_0_2px_theme(colors.zinc.100)] hover:shadow-zinc-100"
            )}
            style={{ fontFamily: 'Audiowide, sans-serif', fontWeight: 400, fontStyle: 'normal' }}
          >
            <span className="link-backdrop"></span>
            <span className="link-text">Restore Terminal</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
