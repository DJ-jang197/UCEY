## ReZone Frontend TODO

- [ ] Wire map markers to Supabase demo sites beyond Ontario top 50
- [ ] Implement real report generation endpoint (`/api/report` or `/api/sites/:id/report` orchestration) once backend AI integration is ready
- [ ] Connect "Save to project" from the site panel to `POST /api/sites/:id/save`
- [ ] Allow switching Auth0 roles (planner / architect / developer) in the dashboard UI
- [ ] Replace demo `x-user-id` / `x-user-role` headers with Auth0 session-derived user data
- [ ] Add PDF export implementation per site report (server-rendered PDF or client-side renderer)
- [ ] Improve accessibility (keyboard map focus, ARIA landmarks, color contrast audit)
- [ ] Add integration tests for map filters, site selection, and dashboard data loading

