export type RequestStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'READY_FOR_SOURCE_REVIEW'
  | 'SOURCE_REVIEW_PASS'
  | 'READY_FOR_MANUAL_REVIEW'
  | 'SOURCE_REVIEW_PASS_PENDING_MANUAL'
  | 'UI_REVIEW_PASS'
  | 'PASS_WITH_NOTES'
  | 'UI_FIX_REQUIRED'
  | 'SPEC_REOPEN_REQUIRED'
  | 'BLOCKED'
  | 'DEFERRED';

export type AcceptanceCaseStatus =
  | 'PENDING'
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'NOT_APPLICABLE';

export interface TrackingAuthority {
  level: string;
  statement: string;
  conflictResolutionOrder: string[];
  rules: string[];
  [key: string]: any;
}

export interface RepositoryInfo {
  name: string;
  branch: string;
  headCommit: string;
  headMessage?: string;
  trackingFilePath?: string;
  role?: string;
  [key: string]: any;
}

export interface TrackingRepositories {
  application?: RepositoryInfo;
  statusConsole?: RepositoryInfo;
  [key: string]: any;
}

export interface TrackingSourceFile {
  path: string;
  role: string;
  protected: boolean;
  [key: string]: any;
}

export interface CurrentTrackingState {
  overallStatus: string;
  currentEpic: string;
  currentRequest: string;
  currentRequestStatus: string;
  nextAllowedRequest: string;
  acceptedRequestCount: number;
  pendingManualSuites: string[];
  blockers: string[];
  latestReviewerFinding: string;
  [key: string]: any;
}

export interface TrackingRequest {
  id: string;
  title: string;
  domain: string;
  status: RequestStatus;
  implementationStatus: string;
  sourceReviewStatus: string;
  manualReviewStatus: string;
  commits: string[];
  files: string[];
  summary: string;
  nextAction: string;
  [key: string]: any;
}

export interface AcceptanceCase {
  id: string;
  title: string;
  expected: string;
  status: AcceptanceCaseStatus;
  verifiedBy?: string | null;
  verifiedDate?: string | null;
  evidence?: string | null;
  notes?: string;
  [key: string]: any;
}

export interface AcceptanceSuite {
  id: string;
  requestId: string;
  domain: string;
  status: string;
  summary: {
    total: number;
    pass: number;
    fail: number;
    pending: number;
  };
  cases: AcceptanceCase[];
  [key: string]: any;
}

export interface RequiredRead {
  file: string;
  sections: string[];
  reason: string;
  [key: string]: any;
}

export interface HandoffState {
  purpose: string;
  readProtocol: string[];
  requiredReads: RequiredRead[];
  activeSourceFiles: string[];
  resumeInstruction: string;
  stopConditions: string[];
  [key: string]: any;
}

export interface Metadata {
  trackedProject: string;
  projectSubtitle?: string;
  trackerVersion?: string;
  statusDate: string;
  currentPhase: string;
  currentFocus: string;
  productionAuthority: string;
  prototypePromotionDefault?: string;
  [key: string]: any;
}

export interface SpecItem {
  id: string;
  domain: string;
  status: string;
  summary: string;
  nextAction: string;
  implementationRelation?: string;
  [key: string]: any;
}

export interface UIItem {
  id: string;
  module: string;
  status: string;
  relatedSpec: string;
  customerDemo: string;
  nextAction: string;
  implementationStatus?: string;
  reviewStatus?: string;
  evidenceRequestId?: string | null;
  [key: string]: any;
}

export interface DecisionItem {
  id: string;
  domain: string;
  decision: string;
  status: string;
  impact: string;
  date: string;
  relatedUI?: string;
  [key: string]: any;
}

export interface OpenItem {
  id: string;
  domain: string;
  question: string;
  status: string;
  reviewTrigger: string;
  [key: string]: any;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  status: string;
  purpose: string;
  entryCriteria?: string[];
  exitCriteria?: string[];
  mainOutputs: string[];
  currentBlockers: string[];
  nextAllowedMove: string;
  [key: string]: any;
}

export interface ChangelogItem {
  id: string;
  timestamp: string;
  summary: string;
  source: string;
  details: string;
  [key: string]: any;
}

export interface AppState {
  schemaVersion?: string;
  documentType?: 'CVF_TRACKING';
  authority?: TrackingAuthority;
  repositories?: TrackingRepositories;
  sourceFiles?: TrackingSourceFile[];
  currentState?: CurrentTrackingState;
  requests?: TrackingRequest[];
  acceptanceSuites?: AcceptanceSuite[];
  handoff?: HandoffState;
  metadata: Metadata;
  specs: SpecItem[];
  uis: UIItem[];
  decisions: DecisionItem[];
  openItems: OpenItem[];
  roadmap: RoadmapPhase[];
  changelog: ChangelogItem[];
  [key: string]: any;
}
