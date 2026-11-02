# Curriculum

Sources: roadmap.sh topic maps (React, Node.js, TypeScript, AI Agents), the official NestJS docs outline, and the
syllabi of popular long courses (React: The Complete Guide, Complete Node.js bootcamps, NestJS Zero to Hero / Deep Dive,
LangGraph agent courses). Each entry is one Short; order is teaching order. `(done)` = built.

## React (30)
1 What is React (done) · 2 Props & composition (done) · 3 State with useState (done) · 4 Rendering & re-renders (done) ·
5 Events & controlled inputs (done) · 6 Lists, keys & conditionals (done) · 7 useEffect · 8 You might not need an effect ·
9 Refs & the DOM · 10 useReducer · 11 useContext · 12 Custom hooks & rules of hooks · 13 Reconciliation & the virtual DOM ·
14 memo, useMemo, useCallback · 15 Component patterns (render props, HOCs, compound) · 16 Portals & error boundaries ·
17 Suspense & lazy loading · 18 Routing (React Router, TanStack Router) · 19 State management (Zustand, Jotai, Redux Toolkit) ·
20 Data fetching & caching (TanStack Query, SWR) · 21 GraphQL clients (Apollo, urql, Relay) · 22 Forms (React Hook Form, Formik) ·
23 Types & validation (TypeScript, Zod) · 24 Styling (Tailwind, CSS Modules, headless UI) · 25 Animation (Framer Motion) ·
26 Concurrent React (transitions) · 27 React 19 Actions · 28 Server Components & Next.js · 29 Testing (RTL, Vitest, Playwright) ·
30 React Native & what to learn next

## Node.js (28)
1 What is Node.js (V8, libuv, vs browser) · 2 Running code & the REPL · 3 The event loop · 4 Timers, setImmediate, nextTick ·
5 Async patterns · 6 EventEmitter · 7 Modules (CommonJS vs ESM) · 8 npm, package.json, semver · 9 Workspaces & publishing ·
10 Error handling · 11 Debugging & stack traces · 12 Files: fs, path, glob · 13 CLI apps (argv, stdin/out, exit codes) ·
14 Env vars & config · 15 Streams · 16 Buffers · 17 The http module · 18 Express & middleware · 19 Fastify, Hono & choosing a framework ·
20 Calling APIs (fetch, axios) · 21 Auth (JWT, Passport) · 22 Databases & ORMs · 23 Testing (node:test, Vitest) · 24 Logging ·
25 Child processes, cluster, worker threads · 26 Memory leaks, GC & profiling · 27 Production: PM2, Docker, graceful shutdown ·
28 Security hardening

## TypeScript (30)
1 Why TypeScript & tsc · 2 tsconfig & compiler options · 3 Primitive types & inference · 4 any, unknown, never ·
5 Arrays, tuples, enums · 6 Interfaces & type aliases · 7 Interface vs type, extending · 8 Unions & intersections ·
9 Literal types & as const · 10 Narrowing & guards · 11 Type predicates & assertion functions · 12 Discriminated unions ·
13 Functions & overloads · 14 Assertions & satisfies · 15 Classes · 16 Access modifiers, abstract, inheritance · 17 Generics ·
18 Constraints & defaults · 19 keyof, typeof, indexed access · 20 Utility types I · 21 Utility types II · 22 Mapped types ·
23 Conditional types & infer · 24 Template literal types · 25 Recursive types · 26 Decorators · 27 Modules & declaration files ·
28 Runtime validation with Zod · 29 Ecosystem: lint, format, build · 30 Migrating JS to TS & pitfalls

## NestJS (38)
1 What is Nest & first steps · 2 Controllers · 3 Providers & DI · 4 Modules · 5 Middleware · 6 Exception filters · 7 Pipes ·
8 Guards · 9 Interceptors · 10 Custom decorators · 11 Request lifecycle · 12 Custom providers · 13 Async providers & dynamic modules ·
14 Injection scopes & circular deps · 15 Execution context & lifecycle events · 16 Configuration · 17 Validation ·
18 Serialization · 19 Logging · 20 Events & task scheduling · 21 Queues · 22 Caching · 23 TypeORM · 24 Prisma · 25 MongoDB ·
26 Authentication (JWT, Passport) · 27 Authorization (RBAC, CASL) · 28 Security (helmet, CORS, CSRF, rate limiting) ·
29 File upload & streaming · 30 Versioning & OpenAPI · 31 Microservices & transports · 32 Kafka, RabbitMQ, NATS ·
33 gRPC & hybrid apps · 34 WebSocket gateways & SSE · 35 GraphQL · 36 CQRS · 37 Resilience: idempotency, outbox, health checks ·
38 Testing & deployment

## Agentic AI (9 done + 22 planned)
Done: what is an agent, tool calling, ReAct, memory, planning, multi-agent, MCP, guardrails, evaluating agents.
Planned: tokens & context windows · sampling (temperature, top-p) · open vs closed models, pricing, streaming · reasoning models ·
fine-tuning vs prompting vs RAG · embeddings & vector search · the RAG pipeline · prompt engineering for agents ·
structured outputs & function-calling APIs · chain & tree of thought · self-critique & reflection · planner-executor & DAG agents ·
build an agent from scratch · frameworks (LangChain, LlamaIndex, CrewAI, AutoGen) · LangGraph · MCP deep dive (hosts, clients, servers) ·
memory deep dive (episodic vs semantic) · human-in-the-loop · evaluation tooling (LangSmith, Ragas) · observability & tracing ·
prompt injection & jailbreaks · sandboxing, PII & red teaming

## LangGraph (20)
Structure follows the LangGraph docs (overview, persistence, interrupts, streaming, subgraphs, testing, deployment).
1 What is LangGraph · 2 Your first graph (StateGraph, START/END) · 3 State & reducers · 4 Nodes & edges (conditional routing) ·
5 Thinking in LangGraph (design method) · 6 Workflows vs agents (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer) ·
7 Tools & the prebuilt ReAct agent · 8 Persistence & checkpointers (threads) · 9 Short-term memory · 10 Long-term memory (Stores) ·
11 Interrupts & human-in-the-loop · 12 Time travel (replay, fork) · 13 Streaming modes · 14 Subgraphs · 15 Parallel execution & Send (map-reduce) ·
16 Multi-agent: supervisor & handoffs · 17 Fault tolerance & retries · 18 Graph execution & the runtime (super-steps) · 19 Testing graphs ·
20 Application structure, Studio, deployment & LangSmith

## DSA in JavaScript (about 80)
**Complexity (4):** 1 What is Big O · 2 O(1), O(log n), O(n) · 3 O(n log n), O(n^2), O(2^n), O(n!) · 4 Space complexity, best/average/worst, amortized
**Arrays (8):** 1 Declare, index, traverse · 2 Insert & delete · 3 Min, max, reverse · 4 Sorting arrays · 5 Remove duplicates, merge · 6 Missing & duplicate numbers · 7 2D arrays & matrices · 8 Array interview patterns
**Strings (6):** 1 Traversal, reverse, palindrome · 2 Anagrams & character frequency · 3 Duplicates & first non-repeating · 4 Substring search · 5 Compression & cleaning · 6 Longest-substring problems
**Hash maps (5):** 1 Map vs object, key-value storage · 2 Frequency counters · 3 Detect duplicates & O(1) lookup · 4 Pairs with a target sum · 5 Grouping elements
**Sets (3):** 1 Set basics & dedupe · 2 Union, intersection, difference · 3 Common elements between arrays
**Stacks (4):** 1 Push, pop, peek & implementing a stack · 2 Balanced parentheses · 3 Reversing with a stack · 4 Next greater element & monotonic stack
**Queues (5):** 1 Enqueue, dequeue & implementing a queue · 2 Circular queue · 3 Queue with two stacks (and back) · 4 BFS with a queue · 5 Priority queue basics
**Linked lists (6):** 1 Singly linked list · 2 Doubly linked list · 3 Insert, delete, traverse · 4 Reverse a list · 5 Cycle detection & middle node · 6 Merge sorted lists
**Trees (7):** 1 Binary tree · 2 Binary search tree · 3 DFS traversals (in/pre/post-order) · 4 Level-order · 5 Height & depth · 6 BST search, min, max · 7 Lowest common ancestor
**Heaps (3):** 1 Min & max heap · 2 Insert & delete · 3 K largest / K smallest
**Graphs (6):** 1 Representations (adjacency list/matrix) · 2 Directed vs undirected · 3 BFS · 4 DFS · 5 Cycle detection & connected components · 6 Shortest path basics
**Advanced (5):** 1 Trie · 2 Union-Find · 3 Segment tree · 4 Fenwick tree · 5 LRU cache
**Algorithms (about 18):** linear search · binary search · simple sorts · merge sort · quicksort · two pointers · sliding window · prefix sum ·
frequency counter · recursion · backtracking · greedy · BFS vs DFS · dynamic programming (memoization) · dynamic programming (tabulation) ·
divide and conquer · bit manipulation

## Interview Q&A (5, done)
Planner + workers · 10K workflows · exactly-once events · 50+ MCP tools · multi-tenant agents

## Also done
Systems design (rate limiter to log compaction): see `data/`.
