# React Hook Form — Form Rules

Use React Hook Form for non-trivial forms and Zod for validation.

## Rules
- Use `zodResolver` where a domain/form schema exists.
- Keep field registration and validation close to the form feature.
- Do not maintain a second duplicate form state in React state.
- Map form DTOs to domain models explicitly when shapes differ.
- Server/domain errors must remain visible to the user.

Do not use React Hook Form for one simple uncontrolled input when native React is clearer.
