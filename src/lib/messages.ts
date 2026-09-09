export type ToastKind = "success" | "info" | "warning" | "error" | "security";

export type ToastPayload = {
  message: string;
  kind: ToastKind;
};

export const MSG = {
  loginNeed: "🔐 로그인이 필요해요.",
  loginReturn: "😊 로그인하면 원래 화면으로 돌아갈게요.",
  loginOk: "😊 로그인이 완료됐어요.",
  loginFail: "⚠️ 입력한 정보를 다시 확인해 주세요.",
  loginIdNeed: "⚠️ 아이디 또는 이메일을 입력해 주세요.",
  passwordShort: "⚠️ 비밀번호는 8자 이상 입력해 주세요.",
  passwordPwned: "⚠️ 이 비밀번호는 사용할 수 없어요. 다른 비밀번호를 입력해 주세요.",
  logoutOk: "👋 로그아웃했어요. 다음에 또 만나요.",
  logoutFail: "😥 로그아웃하지 못했어요. 다시 시도해 주세요.",
  googleStartFail: "😥 구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
  googleUrlFail: "😥 구글 연결 주소를 받지 못했어요. 잠시 후 다시 시도해 주세요.",
  googleFail: "😥 구글 로그인을 마치지 못했어요. 다시 시도해 주세요.",
  signupOk: "📬 인증 메일을 보냈어요. 메일함을 확인해 주세요.",
  signupFail: "😥 가입을 마치지 못했어요. 입력한 정보를 다시 확인해 주세요.",
  signupBusy: "⏳ 지금은 가입과 로그인을 받을 수 없어요. 잠시 뒤 다시 시도해 주세요.",
  usernameNeed: "⚠️ 아이디는 영문 소문자로 시작하는 4~20자로 입력해 주세요.",
  usernameReserved: "⚠️ 이 아이디는 쓸 수 없어요. 다른 아이디를 입력해 주세요.",
  usernameTaken: "⚠️ 이미 쓰는 아이디예요. 다른 아이디를 입력해 주세요.",
  emailNeed: "⚠️ 이메일을 정확하게 입력해 주세요.",
  passwordMismatch: "⚠️ 비밀번호 확인이 서로 달라요.",
  profileNeed: "⚠️ 이름, 생년월일 앞자리와 성별을 알려 주세요.",
  nameBirthNeed: "⚠️ 이름과 생년월일 앞자리를 알려 주세요.",
  nameInvalid: "⚠️ 이름을 다시 확인해 주세요.",
  ageNeed: "⚠️ 만 19세 이상만 가입할 수 있어요.",
  phoneNeed: "⚠️ 휴대폰 번호를 다시 확인해 주세요.",
  termsNeed: "⚠️ 이용약관과 개인정보 처리방침에 동의해 주세요.",
  challengeNeed: "🙏 아래 확인을 마친 뒤 다시 눌러 주세요.",
  challengeRetry: "🙏 확인을 다시 한 뒤 눌러 주세요.",
  findIdOk: "📬 가입한 이메일로 아이디를 확인해 드렸어요.",
  resetRequestOk: "📬 비밀번호를 바꿀 수 있는 메일을 보냈어요.",
  resetOk: "✅ 새 비밀번호로 저장했어요. 로그인해 주세요.",
  resendOk: "📬 인증 메일을 다시 보냈어요.",
  moneyPreparing: "준비 중",
  referralWait: "잠시 기다려 주세요.",
  profileSaved: "✅ 내 정보를 저장했어요.",
  profileSaveFail: "😥 정보를 저장하지 못했어요. 다시 시도해 주세요.",
  verifyNeed: "⚠️ 메일 안의 인증 링크로 들어와 주세요.",
  verifyOk: "✅ 이메일 확인이 끝났어요.",
  verifyFail: "😥 이메일 확인을 마치지 못했어요. 링크를 다시 열어 주세요.",
  verifyLinkBad: "⚠️ 인증 링크가 올바르지 않아요. 메일 속 링크를 다시 열어 주세요.",
  featureSoon: "⏳ 아직 준비 중인 기능이에요. 잠시 후 다시 확인해 주세요.",
  featureSoonNext: "⏳ 아직 준비 중인 기능이에요. 로그인 화면에서 다시 시도해 주세요.",
  genericError: "😥 잠시 문제가 생겼어요. 다시 시도해 주세요.",
  networkError: "📡 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.",
  forbidden: "🔒 이 작업을 할 수 없어요. 다시 로그인해 주세요.",
  copyOk: "✅ 복사했어요.",
  copyFail: "⚠️ 길게 눌러 복사해 주세요.",
  depositNeed: "⚠️ 입금 금액과 입금자 이름을 입력해 주세요.",
  depositOk: "💰 입금 신청을 확인했어요.",
  depositFail: "😥 입금 신청을 보내지 못했어요. 다시 시도해 주세요.",
  withdrawNeedKyc: "🔒 출금 전 본인확인이 필요해요.",
  withdrawNeedAmount: "⚠️ 출금할 테더 금액을 입력해 주세요.",
  withdrawNeedBalance: "💳 사용할 수 있는 금액을 확인해 주세요.",
  withdrawNeedAddress: "⚠️ 받을 테더 주소를 입력해 주세요.",
  withdrawNeedConfirm: "🔒 출금 전 추가 확인을 먼저 마쳐 주세요.",
  withdrawConfirmStart: "⏳ 출금 전 확인을 시작했어요.",
  withdrawCodeSent: "📬 확인 코드를 보냈어요. 메일함을 확인해 주세요.",
  withdrawConfirmNeed: "⚠️ PIN 또는 받은 코드를 입력해 주세요.",
  withdrawConfirmOk: "✅ 출금 전 확인이 끝났어요.",
  withdrawConfirmFail: "😥 출금 전 확인을 마치지 못했어요. 다시 시도해 주세요.",
  withdrawOk: "💰 출금 요청을 확인했어요.",
  withdrawFail: "😥 출금 요청을 보내지 못했어요. 다시 시도해 주세요.",
  kycNeed: "⚠️ 이름, 휴대폰, 생년월일을 알려 주세요.",
  kycNeedFiles: "⚠️ 신분증과 얼굴 사진을 준비해 주세요.",
  kycOk: "📌 본인확인 요청을 보냈어요. 확인이 끝나면 알려 드릴게요.",
  kycFail: "😥 본인확인 요청을 보내지 못했어요. 다시 시도해 주세요.",
  supportNeed: "⚠️ 문의 내용을 입력해 주세요.",
  inviteCopy: "✅ 추천 링크를 복사했어요.",
  inviteShare: "✅ 친구에게 초대장을 열었어요.",
  quoteOk: "✅ 지금 확인할 기회를 다시 가져왔어요.",
  quoteFail: "😥 기회를 다시 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
  participateOk: "🎉 참여 신청이 접수됐어요.",
  participateFail: "😥 참여 신청을 보내지 못했어요. 다시 시도해 주세요.",
  participateBusy: "⏳ 지금 진행 중인 일이 끝난 뒤 다음 기회를 시작할 수 있어요.",
  participateNeedAmount: "⚠️ 아직 참여 금액을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
  noOpportunity: "🔎 아직 확인할 기회가 없어요.",
  notEnoughMoney: "💳 지금은 이 기회에 참여할 금액이 부족해요.",
  noTickets: "⚠️ 남은 참여 횟수가 없어요.",
  waitExecution: "⏳ 처리가 끝날 때까지 잠시만 기다려 주세요.",
  genderMale: "✅ 남성으로 선택했어요.",
  genderFemale: "✅ 여성으로 선택했어요.",
  alertOn: "📌 이 기기에서 알림을 켰어요.",
  alertOff: "📌 이 기기에서 알림을 껐어요.",
  settingOn: "📌 설정을 변경했어요.",
  settingOff: "📌 설정을 변경했어요.",
  chatReset: "✅ 대화를 지웠어요.",
  aiEmpty: "💬 질문을 한 글자 이상 입력해 주세요.",
  aiLogin: "💡 로그인하면 이 질문을 이어서 물어볼게요.",
  aiBusy: "⏳ 지금은 답변을 준비하고 있어요. 조금 뒤 다시 물어봐 주세요.",
  aiWait: "⏳ 답변을 준비하고 있어요.",
  aiUnavailable: "😥 답변을 아직 연결하지 못했어요. 홈에서 기회와 지갑을 직접 확인해 주세요.",
  aiSendFail: "😥 답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;

const TECHNICAL_RE = /unauthorized|forbidden|not found|internal server|bad request|network error|request failed|invalid token|api error|timeout|econn|fetch|exception|payload|endpoint|stack|sql|jwt|oauth|status|http\/|error code|\b\d{3}\b/i;

function mapKnownCode(text: string): string | null {
  if (/TURNSTILE_UNAVAILABLE/i.test(text)) return MSG.signupBusy;
  if (/TURNSTILE_FAILED/i.test(text)) return MSG.challengeRetry;
  if (/TERMS_REQUIRED/i.test(text)) return MSG.termsNeed;
  if (/PASSWORD_TOO_SHORT/i.test(text)) return MSG.passwordShort;
  if (/PASSWORD_PWNED/i.test(text)) return MSG.passwordPwned;
  if (/PASSWORD_CONFIRM_MISMATCH/i.test(text)) return MSG.passwordMismatch;
  if (/USERNAME_RESERVED/i.test(text)) return MSG.usernameReserved;
  if (/USERNAME_INVALID_FORMAT/i.test(text)) return MSG.usernameNeed;
  if (/USERNAME_TAKEN/i.test(text)) return MSG.usernameTaken;
  if (/EMAIL_INVALID/i.test(text)) return MSG.emailNeed;
  if (/DECLARED_NAME_INVALID/i.test(text)) return MSG.nameInvalid;
  if (/BIRTH_DATE_TOO_YOUNG/i.test(text)) return MSG.ageNeed;
  if (/BIRTH_DATE_INVALID/i.test(text)) return MSG.nameBirthNeed;
  if (/REFERRAL_POOL_WAIT/i.test(text)) return MSG.referralWait;
  if (/AUTH_REQUIRED/i.test(text)) return MSG.loginNeed;
  if (/SIGNUP_LINK_INVALID/i.test(text)) return MSG.verifyLinkBad;
  return null;
}

export function userFacingError(error: unknown, fallback: string = MSG.genericError): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const text = raw.trim();
  if (!text) return fallback;
  const known = mapKnownCode(text);
  if (known) return known;
  if (/^[A-Z][A-Z0-9_]+$/.test(text)) return MSG.genericError;
  if (TECHNICAL_RE.test(text) && !/[가-힣]/.test(text)) return fallback;
  if (text === fallback) return fallback;
  return text;
}

export function toastFromError(error: unknown, fallback: string = MSG.genericError): ToastPayload {
  return { message: userFacingError(error, fallback), kind: "error" };
}
