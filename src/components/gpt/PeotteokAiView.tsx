"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/gpt/format";
import { useGpt } from "@/lib/gpt/GptContext";
import { WorkspaceView } from "./WorkspaceView";

const PROMPT_CHIPS = [
  { prompt: "출금 가능한 수익을 알려 주세요", label: "출금 가능 수익" },
  { prompt: "자본을 충전하고 시작하려면 어떻게 해요?", label: "충전하고 시작" },
  { prompt: "지금 볼 만한 기회가 뭐예요?", label: "지금 기회" },
  { prompt: "제가 받을 혜택을 알려 주세요", label: "받을 혜택" },
  { prompt: "친구를 초대하려면 어떻게 해요?", label: "친구 초대" },
  { prompt: "본인 확인은 어디에서 해요?", label: "본인 확인" },
  { prompt: "테더는 어떻게 준비해요?", label: "테더 준비" },
];

// /ai 와 /me/peotteok 이 함께 쓰는 퍼뜩AI 채팅 화면. (원본 data-view="ai" 그대로)
export function PeotteokAiView() {
  const router = useRouter();
  const { state, currentConversation, typing, sendAiQuestion, createConversation, selectConversation } = useGpt();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [currentConversation, typing?.full, typing?.started]);

  function resizeInput() {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = Math.min(112, node.scrollHeight) + "px";
  }

  function submit() {
    const text = input;
    sendAiQuestion(text);
    setInput("");
    window.requestAnimationFrame(resizeInput);
  }

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="ai" aria-labelledby="ai-title">
        <div className="view-intro ai-view-intro">
          <div>
            <span className="view-kicker">내 일을 아는 개인 AI</span>
            <h1 id="ai-title">퍼뜩AI</h1>
            <p>확인된 숫자만 말씀드려요. 출금이나 참여는 대신하지 않아요.</p>
          </div>
          <button id="newConversation" className="quiet-button" type="button" aria-label="새 대화 만들기" onClick={createConversation}>
            새 대화
          </button>
        </div>
        <div className="ai-desk-grid">
          <aside className="conversation-panel" aria-label="이전 대화">
            <div className="conversation-head">
              <strong>이전 대화</strong>
              <small>눌러서 이어가기</small>
            </div>
            <div id="conversationList" className="conversation-list">
              {state.conversations.length === 0 ? <p className="settings-note">아직 이전 대화가 없어요.</p> : null}
              {state.conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={"conversation-item" + (item.id === state.activeConversationId ? " is-active" : "")}
                  aria-label={`${item.title || "새 대화"} 이어가기`}
                  aria-pressed={item.id === state.activeConversationId}
                  onClick={() => selectConversation(item.id)}
                >
                  <strong>{item.title || "새 대화"}</strong>
                  <small>{formatTime(item.updatedAt)}</small>
                </button>
              ))}
            </div>
          </aside>
          <section className="ai-chat-card" aria-label="퍼뜩AI와 대화">
            <div className="ai-chat-head">
              <span className="ai-avatar" aria-hidden="true">
                <img src="/putduk-mark.svg" alt="" />
              </span>
              <div>
                <strong>퍼뜩AI</strong>
                <small>
                  <i></i> 내 데스크를 보고 답해요
                </small>
              </div>
            </div>
            <div id="aiMessages" className="ai-messages" aria-live="polite" ref={messagesRef}>
              {currentConversation?.messages.map((message, index) =>
                message.role === "user" ? (
                  <div className="chat-row user" key={index}>
                    <div className="chat-bubble">{message.text}</div>
                  </div>
                ) : (
                  <div className="chat-row assistant" key={index}>
                    <span className="ai-avatar tiny" aria-hidden="true">
                      <img src="/putduk-mark.svg" alt="" />
                    </span>
                    <div>
                      <div className="chat-bubble">{message.text}</div>
                      {message.evidence?.length ? (
                        <div className="evidence-row">
                          {message.evidence.map((item) => (
                            <button key={item.route + item.label} type="button" onClick={() => router.push(item.route)}>
                              {item.label}
                              <span aria-hidden="true">→</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
              {typing ? (
                <div className="chat-row assistant is-typing">
                  <span className="ai-avatar tiny" aria-hidden="true">
                    <img src="/putduk-mark.svg" alt="" />
                  </span>
                  <div>
                    <div className="chat-bubble">
                      {typing.started ? (
                        typing.full
                      ) : (
                        <span className="typing-dots">
                          <i></i>
                          <i></i>
                          <i></i>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div id="aiChips" className="ai-chip-row" aria-label="질문 예시">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip.prompt}
                  type="button"
                  onClick={() => {
                    setInput(chip.prompt);
                    sendAiQuestion(chip.prompt);
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <form
              id="aiForm"
              className="ai-composer"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <label className="sr-only" htmlFor="aiInput">
                퍼뜩에게 질문
              </label>
              <textarea
                id="aiInput"
                ref={textareaRef}
                rows={1}
                placeholder="자본이 모자라요. 뭐부터 하면 돼요?"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  resizeInput();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              <button id="aiSend" type="submit" aria-label="질문 보내기">
                ↑
              </button>
            </form>
            <p className="ai-disclaimer">숫자는 지갑 기준이에요. 일상 답은 참고용이에요.</p>
          </section>
        </div>
      </section>
    </WorkspaceView>
  );
}
