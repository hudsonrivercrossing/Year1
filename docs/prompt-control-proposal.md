# Prompt control: discussion proposal

Source conversation reread in the actual browser: https://chatgpt.com/share/6ad82395-2974-83ea-a719-25a69d876e87 (Blender建模方案). It proposes the Build → Bring to Life → Play loop first, with natural-language Prompt control as a second iteration over the same assembly/joint model. It does not require regenerating a model for each instruction.

## Recommended first scope

A bilingual text field in Play, with a few suggested phrases and a Stop control. Interpret a sentence into a short bounded plan over existing capabilities: wave, hug, dance, wait and wander. Example: “让他们抱一下，然后一起跳舞” becomes hug → dance → wander. On completion return to independent wandering. A local Node endpoint calls a language model; the browser never receives the provider key. Use a strict schema/tool definition, then enforce action availability, argument ranges, current scene eligibility and a step limit locally. Reject unsupported actions with a short localized explanation. Request the plan once per submitted instruction, while animation runs locally each frame.

This is a proposal only: no API service, credentials, chat input or AI execution was added during the button refinement.

## Existing code and actual work

`startActivity` / `finishActivity` already provide deterministic group wave/hug/dance transitions, busy-state exclusion and return to wander. They currently control the pair as a group. The next implementation needs a promise/event-based action executor, a serialized plan queue, cancellation/reset cleanup and a stop path. An input parser alone cannot make per-character actions work. Individual actor selection (DJ waves while YW keeps walking, etc.) requires moving from the current global `activity` state to per-character behavior plus synchronized pair interactions.

## Difficulty assessment (engineering judgment)

- Group commands and short sequences over the existing three actions: low to medium.
- Named actor/target, move-to, look-at, speed and hold duration, reliable interruption: medium.
- Requests for new physical motions, arbitrary choreography or new buildable scenery: high, requiring new engine/animation/asset capabilities.

The hard part is reliable movement, transitions, synchronization and interruption; a schema-constrained model makes the language interpretation tractable but cannot provide missing motions. Start with group action sequences, then add named actor control. Retain the buttons as quick inputs to the same executor.

Official implementation reference: https://developers.openai.com/api/docs/guides/function-calling . Strict function schemas constrain output shape; runtime scene/semantic validation and cancellation still belong to the application.
