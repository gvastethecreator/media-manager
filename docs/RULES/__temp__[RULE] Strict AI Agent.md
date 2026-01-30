Strict Multi-Agent System Instructions
CRITICAL ENFORCEMENT RULES
1. MANDATORY TODO PROTOCOL

AGENT MUST HALT EXECUTION IF TODO NOT FOLLOWED

BEFORE ANY ACTION:
1. CREATE TODO with all tasks
2. MARK each task as COMPLETE when done
3. UPDATE status in real-time
4. VALIDATE completion before next task
5. FAIL if any task unmarked

2. STRICT TODO FORMAT

## TODO: [FEATURE_NAME]
□ Task 1: [Implementation + acceptance criteria]
□ Task 2: [Implementation + acceptance criteria]
CONTEXT_REQUIRED: [Files/modules needed]
ACCEPTANCE: [Measurable completion criteria]
STATUS: PENDING

## UPDATE RULES:
- ✅ Replace □ with ✅ when COMPLETE
- 🔄 Use 🔄 for IN_PROGRESS
- ❌ Use ❌ for FAILED
- UPDATE STATUS: PENDING → IN_PROGRESS → COMPLETE

3. ENFORCEMENT MECHANISM

class StrictTODOEnforcer:
    def __init__(self):
        self.todo_active = False
        self.tasks_completed = []
        self.validation_required = True

    def execute_task(self, task):
        if not self.todo_active:
            raise TODONotCreatedError("CREATE TODO FIRST")

        if not self.validate_task_completion(task):
            raise TaskNotMarkedError("MARK PREVIOUS TASKS COMPLETE")

        # Execute task
        result = self._execute(task)

        # MANDATORY: Update TODO status
        self.update_todo_status(task, "COMPLETE")

        return result

MULTI-AGENT CONTEXT PROTOCOL
Context Gathering

async def get_context(request: str) -> dict:
    return {
        'llamaindex': await get_indexed_content(request),
        'ragflow': await get_document_structure(request),
        'autogen': await get_conversation_history(request),
        'langgraph': await get_workflow_state(request),
        'files': await analyze_dependencies(request)
    }

Validation Gateway

def validate_context_completeness(context: dict) -> bool:
    required_keys = ['llamaindex', 'ragflow', 'autogen', 'langgraph', 'files']
    return all(key in context and context[key] for key in required_keys)

AGENT IMPLEMENTATIONS
Base Agent

class StrictAgent:
    def __init__(self):
        self.todo_enforcer = StrictTODOEnforcer()
        self.context_validator = ContextValidator()

    async def execute(self, request: str):
        # MANDATORY: Create TODO first
        todo = await self.create_todo(request)

        # MANDATORY: Get full context
        context = await self.get_context(request)

        # MANDATORY: Validate context
        if not self.context_validator.validate(context):
            raise ContextIncompleteError("INCOMPLETE CONTEXT")

        # Execute each task with strict updates
        for task in todo.tasks:
            result = await self.execute_task_with_updates(task, context)
            self.todo_enforcer.mark_complete(task)

        return result

Conversation Agent (AutoGen)

class ConversationAgent(StrictAgent):
    async def conduct_interview(self, request: str):
        context = await self.get_context(request)
        questions = await self.generate_questions(request, context)
        return {'questions': questions, 'context': context}

Intelligence Agent (RAGFlow)

class IntelligenceAgent(StrictAgent):
    async def analyze_documents(self, docs: list, context: dict):
        return {
            'structure': await self.analyze_structure(docs, context),
            'compliance': await self.validate_compliance(docs, context),
            'confidence': await self.score_confidence(docs, context)
        }

Orchestration Agent (LangGraph)

class OrchestrationAgent(StrictAgent):
    async def orchestrate_generation(self, request: dict, context: dict):
        plan = await self.create_workflow_plan(request, context)
        deps = await self.map_dependencies(plan)
        return await self.execute_workflow(plan, deps, context)

Knowledge Agent (LlamaIndex)

class KnowledgeAgent(StrictAgent):
    async def index_content(self, content: dict, context: dict):
        chunks = await self.create_chunks(content, context)
        embeddings = await self.batch_embed(chunks)
        return await self.store_with_versioning(chunks, embeddings, context)

FILE OPERATIONS
Context Analysis

async def analyze_file_context(file_path: str) -> dict:
    return {
        'content': await read_file(file_path),
        'dependencies': await map_dependencies(file_path),
        'usage': await find_usage_patterns(file_path),
        'breaking_risk': await assess_breaking_changes(file_path)
    }

Safe Update Protocol

async def update_file_with_context(file_path: str, changes: dict):
    context = await analyze_file_context(file_path)
    validation = await validate_changes(changes, context)

    if not validation['safe']:
        raise BreakingChangeError("BREAKING CHANGES DETECTED")

    backup = await create_backup(file_path)
    try:
        await apply_changes(file_path, changes, context)
        await run_integration_tests(file_path)
        return {'success': True}
    except Exception as e:
        await restore_backup(file_path, backup)
        raise e

VALIDATION SYSTEM
Task Validation

async def validate_task(task_id: str) -> dict:
    checks = {
        'context_analyzed': await check_context_analysis(task_id),
        'implementation_complete': await check_implementation(task_id),
        'no_breaking_changes': await check_breaking_changes(task_id),
        'tests_passing': await run_tests(task_id),
        'integration_working': await check_integration(task_id)
    }

    if not all(checks.values()):
        raise ValidationError(f"VALIDATION FAILED: {checks}")

    return {'status': 'PASS', 'checks': checks}

QUALITY STANDARDS

QUALITY_RULES = {
    'naming': {
        'functions': 'descriptive_verbs',
        'classes': 'descriptive_nouns',
        'variables': 'meaningful_context'
    },
    'files': {
        'max_lines': 300,
        'single_responsibility': True
    },
    'performance': {
        'simple_query': '<2s',
        'complex_query': '<30s'
    },
    'security': {
        'input_validation': True,
        'xss_protection': True,
        'compliance': ['SOX', 'GDPR', 'HIPAA']
    }
}

EXECUTION WORKFLOW

1. RECEIVE_REQUEST → Parse user request
2. CREATE_TODO → MANDATORY structured TODO
3. ANALYZE_CONTEXT → Get comprehensive context
4. VALIDATE_CONTEXT → Ensure completeness
5. EXECUTE_TASK → Implement with context awareness
6. UPDATE_TODO → MANDATORY mark task complete
7. VALIDATE_IMPLEMENTATION → Run validation
8. REPEAT → Continue to next task
9. FINAL_VALIDATION → Complete module validation

ERROR HANDLING

class StrictErrorHandler:
    def handle_error(self, error: Exception, context: dict):
        if isinstance(error, TODONotCreatedError):
            return "CREATE TODO FIRST - EXECUTION HALTED"
        elif isinstance(error, TaskNotMarkedError):
            return "MARK PREVIOUS TASKS COMPLETE - EXECUTION HALTED"
        elif isinstance(error, ContextIncompleteError):
            return "INCOMPLETE CONTEXT - EXECUTION HALTED"

        # Execute rollback
        self.execute_rollback(context)
        return f"ERROR: {str(error)} - ROLLBACK EXECUTED"

SUCCESS CRITERIA

    TODO Compliance: 100% adherence to TODO system
    Context Awareness: Complete context analysis before any action
    Quality Standards: All code meets enterprise requirements
    Test Coverage: 90%+ with comprehensive edge cases
    Security: All compliance requirements satisfied
    Integration: Multi-agent workflows function correctly

CRITICAL ENFORCEMENT

    HALT EXECUTION if TODO not created
    HALT EXECUTION if tasks not marked complete
    HALT EXECUTION if context incomplete
    MANDATORY TODO updates for every task
    MANDATORY validation before marking complete
    MANDATORY rollback on any failure

AGENT RESPONSE FORMAT

## TODO: [FEATURE_NAME]
□ Task 1: [Details]
□ Task 2: [Details]
CONTEXT_REQUIRED: [Files]
ACCEPTANCE: [Criteria]
STATUS: PENDING

[Execute Task 1]
✅ Task 1: [Details] - COMPLETE

[Execute Task 2]
✅ Task 2: [Details] - COMPLETE

STATUS: COMPLETE

NO EXCEPTIONS. NO BYPASSING. STRICT COMPLIANCE ONLY.