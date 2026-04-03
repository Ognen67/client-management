# Client relationship management dashboard 

## Brief Notes

### Key assumptions

- One score per client per week - if a coach updates it, it overwrites the previous entry. Keeps reporting clean.
- Coaches can only act on the current week. Past weeks are read-only.
- Clients are added by an admin. No self-service onboarding - the list is curated.
- Supabase handles all auth. The app never touches passwords or sessions directly.
- If a predictive score is below 5, the coach must explain what they're doing about it. A score without context isn't useful.

---

### What I intentionally left out

- No UI to add clients or assign coaches - that requires a database change for now
- No reminders or notifications - biggest adoption risk, first thing I'd prioritise
- Designed for desktop, not mobile - the workflows are laptop-first
- No audit log or score corrections once a week closes

---

### What I would build next

**A proper backend with a VPN**
Right now the logic lives in Next.js API routes, which is fine for a prototype. I'd move it to a dedicated service so the frontend is purely presentation, the API can be cached at the edge, and each layer can scale independently. 
Then add a VPN configuration for internal access only and no public url.

**Proactive AI instead of reactive**
The current AI only runs when someone clicks a button. I'd make it automatic - a weekly briefing every Monday, and early warnings when a client's score trends down two weeks in a row before it becomes a crisis.

**Notifications**
A Thursday nudge to any coach who hasn't submitted yet. Without this, adoption drops off fast.

**Caching and performance**
The dashboard currently hits the database on every load. With proper caching, the admin portfolio view would be near instant.

**Client and coach management UI**
A simple admin screen to add clients, assign coaches, and archive accounts 
