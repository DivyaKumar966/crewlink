import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { io } from 'socket.io-client';
import { Search, Plus, Users, Code2, LayoutDashboard, Compass, FolderGit2, Shield, LogOut, Bell, Trash2, GitCommitHorizontal, Menu, ChevronRight, CheckCircle2, ExternalLink, Check, X } from 'lucide-react';
import api from './api';
import { AuthProvider, useAuth } from './AuthContext';

const skills = ['React', 'Node.js', 'Express', 'MongoDB', 'MERN Stack', 'Java', 'Spring Boot', 'JavaScript', 'TypeScript', 'Python', 'Django', 'PostgreSQL', 'MySQL', 'Flutter', 'UI/UX'];
const categories = ['Web Development', 'Full Stack Development', 'Frontend Development', 'Backend Development', 'Mobile Development', 'Desktop Applications'];
const logo = '/crewlink-logo.png';

function Brand() {
  return <NavLink to="/" className="brand"><img className="brand-logo" src={logo} alt="CREWLINK logo" /><span className="brand-word">CREW<span>LINK</span></span></NavLink>;
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('crewlink_theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('crewlink_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <button className="theme-toggle" onClick={() => setDark(v => !v)} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀ Light' : '☾ Dark'}</button>;
}

function Login() {
  const { user, googleLogin, emailAuth } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) nav('/'); }, [user]);
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await emailAuth(mode, { name, email, password });
      nav(data.needsProfile ? '/profile/setup' : '/');
    } catch (e) { setError(e.response?.data?.message || 'Could not continue. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="landing-page">
    <header className="landing-nav"><Brand /><nav><a href="#how-it-works">How it works</a><a href="#why-crewlink">Why CREWLINK</a></nav><ThemeToggle /></header>
    <main className="landing-hero">
      <section className="landing-copy"><p className="eyebrow">A BETTER WAY TO BUILD TOGETHER</p><h1>Good ideas need<br/><em>the right crew.</em></h1><p className="muted">Find developers, designers and builders who share your ambition. Join real projects, take ownership of tasks and turn ideas into something people can use.</p>
      <div className="landing-points"><span>✓ Find projects that match your skills</span><span>✓ Build with a focused team</span><span>✓ Track tasks and project progress</span></div>
      <div className="landing-art"><img src={logo} alt="CREWLINK team logo"/><div><b>Find your people.</b><small>Share skills. Ship projects. Grow together.</small></div></div></section>
      <section className="auth-card"><div className="auth-card-head"><span className="eyebrow">JOIN THE COMMUNITY</span><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p>{mode === 'login' ? 'Sign in and pick up where your team left off.' : 'A few details and you are ready to find your crew.'}</p></div>
      <form onSubmit={submit}>{mode === 'register' && <label>Your name<input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required /></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength="8" required /></label><button className="btn-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in with email' : 'Create account'}</button></form>
      <div className="auth-divider"><span>OR CONTINUE WITH</span></div><div className="google-login-wrap"><GoogleLogin width="320" text="continue_with" shape="rectangular" onSuccess={async r => { try { const data = await googleLogin(r.credential); nav(data.needsProfile ? '/profile/setup' : '/'); } catch (e) { setError(e.response?.data?.message || 'Google sign-in failed'); } }} onError={() => setError('Google sign-in was not successful.')} /></div>
      {error && <p className="error">{error}</p>}<p className="auth-switch">{mode === 'login' ? "New to CREWLINK?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><small className="login-foot">By continuing, you agree to use CREWLINK responsibly.</small>
      </section>
    </main>
    <section className="landing-info" id="how-it-works"><p className="eyebrow">HOW IT WORKS</p><h2>From idea to a team that ships.</h2><div className="landing-steps"><article><b>01 · Discover</b><p>Explore projects by technology, category and the roles teams need.</p></article><article><b>02 · Connect</b><p>Apply for a role and let the project leader review your request.</p></article><article><b>03 · Build</b><p>Work on assigned tasks, share progress and celebrate completed work.</p></article></div></section>
    <section className="landing-info why" id="why-crewlink"><p className="eyebrow">WHY CREWLINK</p><h2>Less searching. More building.</h2><p className="muted">A shared space for project discovery, team coordination, task ownership and GitHub activity.</p></section>
    <footer className="landing-footer"><Brand/><span>CREWLINK · Build better, together.</span></footer>
  </div>;
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  async function load() {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch { }
  }

  useEffect(() => { load(); }, [location.pathname]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('crewlink_token') }
    });
    socket.on('notification:new', notification => {
      setItems(current => [notification, ...current]);
      setUnread(count => count + 1);
    });
    return () => socket.disconnect();
  }, []);

  async function markRead(item) {
    if (!item.read) {
      try {
        await api.patch(`/notifications/${item._id}/read`);
        setItems(current => current.map(n => n._id === item._id ? { ...n, read: true } : n));
        setUnread(count => Math.max(0, count - 1));
      } catch { }
    }
    if (item.project?._id) window.location.href = `/projects/${item.project._id}`;
    setOpen(false);
  }

  async function markAll() {
    try {
      await api.patch('/notifications/read-all');
      setItems(current => current.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { }
  }

  return <div className="notification-wrap">
    <button className="notification-button" onClick={() => setOpen(!open)} aria-label="Notifications">
      <Bell size={19} />{unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <div className="notification-panel">
      <div className="notification-heading"><b>Notifications</b><button onClick={markAll}>Mark all read</button></div>
      {items.length ? items.map(item => <button className={item.read ? 'notification-item' : 'notification-item unread'} key={item._id} onClick={() => markRead(item)}>
        <span className="notification-avatar">{item.sender?.avatar ? <img src={item.sender.avatar} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <Users size={16} />}</span>
        <span><b>{item.message}</b><small>{item.project?.name || 'CREWLINK'} · {new Date(item.createdAt).toLocaleString()}</small></span>
        {!item.read && <i />}
      </button>) : <p className="notification-empty">You're all caught up.</p>}
    </div>}
  </div>;
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  return <><header className="topbar"><button className="mobile-menu" onClick={() => setMobile(!mobile)}><Menu /></button><Brand /><div className="top-user"><ThemeToggle /><Notifications />{user?.avatar && !avatarFailed ? <img src={user.avatar} onError={() => setAvatarFailed(true)} alt="" /> : <span className="avatar-fallback">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>}<span>{user?.name}</span><button onClick={logout} title="Sign out"><LogOut size={16} /></button></div></header>
    <div className="layout"><aside className={mobile ? 'sidebar open' : 'sidebar'}><div className="side-label">WORKSPACE</div><NavLink to="/"><LayoutDashboard /> Overview</NavLink><NavLink to="/discover"><Compass /> Discover projects</NavLink><NavLink to="/mine"><FolderGit2 /> My projects</NavLink><NavLink to="/profile"><Users /> My profile</NavLink>{user?.role === 'admin' && <><div className="side-label extra">ADMIN</div><NavLink to="/admin"><Shield /> Admin panel</NavLink></>}<div className="side-create"><b>Have an idea?</b><p>Find the right people to build it with you.</p><NavLink to="/create">Create a project <Plus size={14} /></NavLink></div></aside><main className="content">{children}</main></div>
  </>;
}
function PageTitle({ tag, title, desc, action }) { return <div className="page-title"><div><div className="eyebrow">{tag}</div><h1>{title}</h1><p>{desc}</p></div>{action}</div> }
function ProjectCard({ project }) {
  const open = project.roles?.reduce((n, r) => n + Math.max(0, r.required - r.filled), 0) || 0;
  return <article className="project-card"><div className="card-top"><span className="project-icon"><Code2 /></span><span className={open ? 'available' : 'full'}>{open ? '● Recruiting' : '● No open roles'}</span></div><h3>{project.name}</h3><small className="category">{project.category}</small><p>{project.description}</p><div className="chips">{project.technologies?.slice(0, 5).map(t => <span key={t}>{t}</span>)}</div><div className="card-info"><span><Users size={14} />{project.members?.length || 0} members</span><span>{open} open roles</span></div><NavLink className="card-link" to={`/projects/${project._id}`}>View project <ChevronRight size={15} /></NavLink></article>;
}
function Dashboard() {
  const [projects, setProjects] = useState([]), [q, setQ] = useState(''), [tech, setTech] = useState(''), [category, setCategory] = useState('');
  async function load() { const { data } = await api.get('/projects', { params: { q, technology: tech, category } }); setProjects(data); }
  useEffect(() => { load().catch(() => { }); }, [q, tech, category]);
  return <><PageTitle tag="YOUR CREATIVE NETWORK" title={<>Build more. <em>Together.</em></>} desc="Discover ambitious projects, meet talented people, and turn great ideas into reality." action={<NavLink className="btn-primary" to="/create"><Plus size={16} /> Create project</NavLink>} />
    <section className="hero"><div><span>YOUR NEXT COLLABORATION STARTS HERE</span><h2>Great things happen<br />when the right people connect.</h2><p>Find a project that matches your skills or bring your own idea to life.</p><NavLink to="/discover" className="hero-btn">Explore projects <ChevronRight size={16} /></NavLink></div><div className="hero-graphic"><div className="hero-people"><img src={logo} alt="" /></div><i></i><b></b></div></section>
    <div className="stats"><div><small>PROJECTS SHOWN</small><b>{projects.length}</b><span>Matching your filters</span></div><div><small>BUILD WITH OTHERS</small><b>CREW</b><span>Developers, designers & creators</span></div><div><small>YOUR NEXT STEP</small><b>Join in</b><span>Find a role that fits you</span></div></div>
    <div className="filters"><div className="search-box"><Search /><input placeholder="Search project name or technology..." value={q} onChange={e => setQ(e.target.value)} /></div><select value={tech} onChange={e => setTech(e.target.value)}><option value="">All technologies</option>{skills.map(s => <option key={s}>{s}</option>)}</select><select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
    <div className="section-head"><div><h2>Projects you can join</h2><p>Explore teams looking for people like you.</p></div><NavLink to="/discover">View all <ChevronRight size={15} /></NavLink></div>
    <div className="project-grid">{projects.map(p => <ProjectCard key={p._id} project={p} />)}</div>{!projects.length && <div className="empty">No projects found. Create the first one or change your search.</div>}
  </>;
}
function Discover() { return <Dashboard /> }
function CreateProject() {
  const [form, setForm] = useState({ name: '', description: '', category: categories[1], technologies: [], githubRepo: '', roles: [{ name: 'Frontend Developer', required: 1 }, { name: 'Backend Developer', required: 1 }] });
  const [manual, setManual] = useState(''), [error, setError] = useState(''), [saved, setSaved] = useState(false); const nav = useNavigate();
  function change(k, v) { setForm({ ...form, [k]: v }); }
  function toggle(t) { change('technologies', form.technologies.includes(t) ? form.technologies.filter(x => x !== t) : [...form.technologies, t]); }
  async function submit(e) { e.preventDefault(); setError(''); try { await api.post('/projects', form); setSaved(true); setTimeout(() => nav('/'), 700); } catch (err) { setError(err.response?.data?.message || 'Could not create project'); } }
  return <><PageTitle tag="BRING YOUR IDEA TO LIFE" title="Create a project" desc="Describe your idea and choose the roles you need." /><form className="form-panel" onSubmit={submit}><label>Project name<input required value={form.name} onChange={e => change('name', e.target.value)} placeholder="e.g. CampusConnect" /></label><label>Project description<textarea required rows="4" value={form.description} onChange={e => change('description', e.target.value)} placeholder="What are you building and what problem will it solve?" /></label><label>Category<select value={form.category} onChange={e => change('category', e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Technology stack</label><div className="tech-list">{skills.map(s => <button type="button" className={form.technologies.includes(s) ? 'selected' : ''} onClick={() => toggle(s)} key={s}>{s}</button>)}</div><div className="add-tech"><input value={manual} onChange={e => setManual(e.target.value)} placeholder="Add another technology" /><button type="button" className="btn-light" onClick={() => { if (manual.trim()) toggle(manual.trim()); setManual('') }}>Add</button></div><div className="section-head"><h3>Required roles</h3><button type="button" className="text-btn" onClick={() => change('roles', [...form.roles, { name: '', required: 1 }])}>+ Add role</button></div>{form.roles.map((r, i) => <div className="role-row" key={i}><input placeholder="Role name" value={r.name} required onChange={e => change('roles', form.roles.map((x, j) => i === j ? { ...x, name: e.target.value } : x))} /><input type="number" min="1" max="30" value={r.required} onChange={e => change('roles', form.roles.map((x, j) => i === j ? { ...x, required: Number(e.target.value) } : x))} /><button type="button" onClick={() => change('roles', form.roles.filter((_, j) => i !== j))}>×</button></div>)}<label>GitHub repository (optional)<input value={form.githubRepo} onChange={e => change('githubRepo', e.target.value)} placeholder="https://github.com/username/repository" /></label>{error && <p className="error">{error}</p>}{saved && <p className="success"><CheckCircle2 /> Project created</p>}<button className="btn-primary" type="submit">Publish project <ChevronRight size={16} /></button></form></>;
}
function ProjectDetails() {
  const { id } = useParams(); const { user } = useAuth(); const [project, setProject] = useState(null), [msg, setMsg] = useState('');
  useEffect(() => { api.get(`/projects/${id}`).then(r => setProject(r.data)).catch(() => setMsg('Project not found')); }, [id]);
  async function apply(roleId) { try { await api.post(`/projects/${id}/apply`, { roleId }); setMsg('Application sent to project leader.'); setProject(p => ({ ...p, appliedRoleIds: [...(p.appliedRoleIds || []), roleId] })); } catch (e) { setMsg(e.response?.data?.message || 'Could not apply'); } }
  if (!project) return <p>{msg || 'Loading project...'}</p>;
  const ownProject = String(project.leader?._id) === String(user?._id);
  return <><PageTitle tag="PROJECT DETAILS" title={project.name} desc={project.description} action={(ownProject || project.isMember) ? <NavLink className="btn-primary" to={`/workspace/${id}`}>Open workspace <ChevronRight size={16} /></NavLink> : null} /><div className="detail-grid"><section className="white-panel"><h2>{ownProject ? 'Your project roles' : 'Open positions'}</h2>{ownProject && <p>You are the project leader. You cannot apply to your own project.</p>}{project.roles.map(r => <div className="role-line" key={r._id}><div><b>{r.name}</b><small>{Math.max(0, r.required - r.filled)} slots available</small></div>{!ownProject && !project.isMember && <button className="btn-primary" disabled={project.status === 'completed' || r.filled >= r.required || project.appliedRoleIds?.includes(String(r._id))} onClick={() => apply(r._id)}>{project.status === 'completed' ? 'Completed' : project.appliedRoleIds?.includes(String(r._id)) ? 'Applied' : 'Apply'}</button>}</div>)}</section><section className="white-panel"><h2>Project overview</h2><p><b>Leader:</b> <NavLink className="profile-inline-link" to={`/users/${project.leader?._id}`}>{project.leader?.name}</NavLink></p><p><b>Category:</b> {project.category}</p><p><b>Stack:</b> {project.technologies.join(', ')}</p>{project.githubRepo && <a href={project.githubRepo} target="_blank" rel="noreferrer">GitHub repository <ExternalLink size={14} /></a>}{project.isMember && !ownProject && <p className="success">You are a member of this project.</p>}</section></div>{msg && <p className="notice">{msg}</p>}</>;
}
function MyProjects() {
  const [projects, setProjects] = useState([]); useEffect(() => { api.get('/projects/mine').then(r => setProjects(r.data)).catch(() => { }); }, []);
  return <><PageTitle tag="YOUR WORK" title="My projects" desc="Projects you lead or are a member of." /><div className="project-grid">{projects.map(p => <ProjectCard key={p._id} project={p} />)}</div>{!projects.length && <div className="empty">You have not joined or created a project yet.</div>}</>;
}
function Profile({ setup = false }) {
  const { user, updateProfile } = useAuth();
  const [skillsValue, setSkillsValue] = useState(user?.knownSkills || []);
  const [github, setGithub] = useState(user?.githubUsername || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolioUrl || '');
  const [bio, setBio] = useState(user?.bio || ''); const [message, setMessage] = useState('');
  async function save(e) { e.preventDefault(); try { await updateProfile({ githubUsername: github, githubUrl, linkedinUrl, portfolioUrl, knownSkills: skillsValue, bio }); setMessage('Profile saved.'); if (setup) location.href = '/'; } catch (e) { setMessage(e.response?.data?.message || 'Could not save profile'); } }
  return <><PageTitle tag="YOUR IDENTITY" title="Developer profile" desc="Add your links and experience so project leaders can understand your work." /><form className="form-panel profile-form" onSubmit={save}><div className="profile-head">{user?.avatar ? <img src={user.avatar} /> : <span className="profile-avatar-fallback">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>}<div><h2>{user?.name}</h2><p>{user?.email}</p><NavLink to={`/users/${user?._id}`} className="text-btn">View public profile</NavLink></div></div>
  <label>Email address<input value={user?.email || ''} readOnly /></label><label>GitHub username<input value={github} onChange={e => setGithub(e.target.value)} placeholder="your-github-username" /></label><label>GitHub profile URL<input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/username" /></label><label>LinkedIn profile URL<input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/username" /></label><label>Portfolio URL<input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" /></label><label>About you<textarea rows="4" value={bio} onChange={e => setBio(e.target.value)} placeholder="Your interests, experience and what you enjoy building" /></label><label>Known technologies</label><div className="tech-list">{skills.map(s => <button type="button" className={skillsValue.includes(s) ? 'selected' : ''} onClick={() => setSkillsValue(skillsValue.includes(s) ? skillsValue.filter(x => x !== s) : [...skillsValue, s])} key={s}>{s}</button>)}</div><button className="btn-primary">Save profile</button>{message && <p className="notice">{message}</p>}</form></>;
}

function PublicProfile() {
  const { userId } = useParams(); const [profile, setProfile] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/users/${userId}/public`).then(r => setProfile(r.data)).catch(e => setError(e.response?.data?.message || 'Could not load profile')); }, [userId]);
  if (error) return <div className="empty">{error}</div>; if (!profile) return <p>Loading developer profile...</p>;
  const u = profile.user; const links = [['GitHub', u.githubUrl || (u.githubUsername ? `https://github.com/${u.githubUsername}` : '')], ['LinkedIn', u.linkedinUrl], ['Portfolio', u.portfolioUrl]].filter(x => x[1]);
  return <><PageTitle tag="DEVELOPER PROFILE" title={u.name} desc="Public CREWLINK developer profile" /><section className="white-panel public-profile"><div className="profile-head">{u.avatar ? <img src={u.avatar} /> : <span className="profile-avatar-fallback">{u.name?.[0]}</span>}<div><h2>{u.name}</h2><p>{u.email}</p></div></div><p>{u.bio || 'This developer has not added an introduction yet.'}</p><div className="profile-links">{links.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div><div className="stats profile-stats"><div><small>PROJECTS</small><b>{profile.stats.total}</b></div><div><small>ACTIVE</small><b>{profile.stats.active}</b></div><div><small>COMPLETED</small><b>{profile.stats.completed}</b></div><div><small>LED</small><b>{profile.stats.led}</b></div></div><h2>Technology skills</h2><div className="tech-list">{u.knownSkills?.length ? u.knownSkills.map(s => <span className="skill-chip" key={s}>{s}</span>) : <span className="muted">No skills added yet.</span>}</div></section><div className="section-head"><h2>Projects and contributions</h2></div><div className="project-grid">{profile.projects.map(p => <article className="project-card" key={`${p._id}-${p.participation}`}><h3>{p.name}</h3><small>{p.participation} · {p.projectStatus}</small><p>{p.description}</p><div className="chips">{p.technologies?.map(t => <span key={t}>{t}</span>)}</div><NavLink className="card-link" to={`/projects/${p._id}`}>View project <ChevronRight size={15}/></NavLink></article>)}</div>{!profile.projects.length && <div className="empty">No CREWLINK projects yet.</div>}</>;
}

function Workspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null), [tasks, setTasks] = useState([]), [title, setTitle] = useState(''), [assigned, setAssigned] = useState(''), [activity, setActivity] = useState([]), [requests, setRequests] = useState([]), [message, setMessage] = useState('');
  async function refresh() {
    const { data: refreshed } = await api.get(`/projects/${id}/workspace`);
    setData(refreshed); setTasks(refreshed.tasks || []);
  }
  async function loadRequests() { try { const { data } = await api.get(`/projects/${id}/requests`); setRequests(data); } catch { } }
  useEffect(() => {
    refresh().catch(() => setMessage('Could not load workspace. Make sure you are a project member.'));
    loadRequests();
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', { auth: { token: localStorage.getItem('crewlink_token') } });
    socket.emit('project:join', id);
    socket.on('github:activity', x => setActivity(a => [x, ...a]));
    socket.on('task:created', x => setTasks(a => a.some(t => t._id === x._id) ? a : [x, ...a]));
    socket.on('task:updated', x => setTasks(a => a.map(t => t._id === x._id ? x : t)));
    socket.on('member:warned', () => refresh());
    socket.on('member:removed', () => refresh());
    socket.on('member:left', () => refresh());
    return () => { socket.emit('project:leave', id); socket.disconnect(); };
  }, [id]);
  async function addTask(e) {
    e.preventDefault();
    try { const { data: task } = await api.post(`/workspace/${id}/tasks`, { title, assignedTo: assigned }); setTasks(t => [task, ...t]); setTitle(''); setAssigned(''); setMessage('Task assigned. The selected member has been notified.'); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not assign task'); }
  }
  async function updateTask(task, status) {
    try { const { data: updated } = await api.patch(`/workspace/${id}/tasks/${task._id}/status`, { status }); setTasks(current => current.map(t => t._id === updated._id ? updated : t)); setMessage(status === 'In progress' ? 'Task started.' : 'Task marked as finished.'); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not update task'); }
  }
  async function warn(memberId) {
    const reason = prompt('Enter the reason for this warning:');
    if (reason === null) return;
    try { const { data: result } = await api.post(`/workspace/${id}/members/${memberId}/warn`, { reason }); setMessage(`Warning issued. Total warnings: ${result.warningCount}`); await refresh(); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not issue warning'); }
  }
  async function remove(memberId) {
    if (!window.confirm('This member has been warned. Remove them from this project?')) return;
    try { const { data: result } = await api.delete(`/workspace/${id}/members/${memberId}`); setMessage(result.message); await refresh(); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not remove member'); }
  }
  async function setProjectStatus(status) { try { const { data: result } = await api.patch(`/projects/${id}/status`, { status }); setData(d => ({ ...d, status })); setMessage(result.message); } catch (e) { setMessage(e.response?.data?.message || 'Could not update project status'); } }
  async function leaveProject() { if (!window.confirm('Leave this project? Your role will become available again.')) return; try { const { data: result } = await api.post(`/projects/${id}/leave`); setMessage(result.message); location.href = '/mine'; } catch (e) { setMessage(e.response?.data?.message || 'Could not leave project'); } }
  async function review(requestId, approve) {
    try { await api.post(`/projects/${id}/requests/${requestId}`, { approve }); setMessage(approve ? 'Application approved.' : 'Application rejected.'); loadRequests(); await refresh(); }
    catch (e) { setMessage(e.response?.data?.message || 'Could not review application'); }
  }
  if (!data) return <PageTitle tag="WORKSPACE" title="Loading workspace" desc={message || ''} />;
  const visibleTasks = data.isLeader ? tasks : tasks.filter(t => String(t.assignedTo?._id || t.assignedTo) === String(user?._id));
  return <><PageTitle tag="TEAM WORKSPACE" title={data.name} desc="Coordinate targets and follow project activity." action={<div className="request-actions">{data.isLeader && <button className="btn-light" onClick={() => setProjectStatus(data.status === 'completed' ? 'active' : 'completed')}>{data.status === 'completed' ? 'Reopen project' : 'Mark completed'}</button>}{!data.isLeader && data.isMember && <button className="btn-danger leave-project" onClick={leaveProject}>Leave project</button>}</div>} />
    <div className="detail-grid">
      <section className="white-panel"><h2>Crew members</h2>{data.members?.filter(m => m.status === 'active').map(m => <div className="role-line" key={m._id}><div><NavLink className="applicant-name" to={`/users/${m.user?._id}`}><b>{m.user?.name}</b></NavLink><small>{m.roleId?.name} · {m.warningCount || 0} warning(s)</small>{m.warnings?.map((w, i) => <small key={i}>Warning {i + 1}: {w.reason}</small>)}</div>{data.isLeader && <div className="request-actions"><button className="btn-light" onClick={() => warn(m._id)}>Issue warning</button>{m.warningCount > 0 && <button className="btn-danger" onClick={() => remove(m._id)}>Remove</button>}</div>}</div>)}</section>
      {data.isLeader && <section className="white-panel"><h2>Assign a target</h2><form onSubmit={addTask}><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task description" required /><select value={assigned} onChange={e => setAssigned(e.target.value)} required><option value="">Choose member</option>{data.members?.filter(m => m.status === 'active').map(m => <option key={m._id} value={m.user?._id}>{m.user?.name}</option>)}</select><button className="btn-primary">Assign task</button></form></section>}
    </div>
    <section className="white-panel activity"><div className="section-head"><div><h2>{data.isLeader ? 'Team tasks' : 'Tasks assigned to you'}</h2><p>{data.isLeader ? 'Track work assigned to your crew.' : 'Only tasks assigned to your account are shown here.'}</p></div></div>
      {visibleTasks.length ? visibleTasks.map(t => <div className="role-line task-line" key={t._id}><div><b>{t.title}</b><small>{data.isLeader ? `Assigned to ${t.assignedTo?.name || 'member'}` : 'Assigned to you'} · {t.status}</small></div>{!data.isLeader && <div className="request-actions">{t.status === 'To do' && <button className="btn-primary" onClick={() => updateTask(t, 'In progress')}>Start</button>}{t.status === 'In progress' && <button className="btn-primary" onClick={() => updateTask(t, 'Completed')}>Finish</button>}{t.status === 'Completed' && <span className="success">Completed ✓</span>}</div>}</div>) : <p className="muted">{data.isLeader ? 'No tasks assigned yet.' : 'No tasks have been assigned to you yet.'}</p>}
    </section>
    {data.isLeader && <section className="white-panel activity"><h2>Pending applications</h2>{requests.length ? requests.map(r => <div className="role-line" key={r._id}><div><NavLink className="applicant-name" to={`/users/${r.user?._id}`}><b>{r.user?.name}</b><small>View full developer profile ↗</small></NavLink><small>{r.user?.email} · {data.roles.find(role => String(role._id) === String(r.roleId))?.name}</small><small>{r.user?.knownSkills?.join(', ')}</small></div><div className="request-actions"><button className="btn-primary" onClick={() => review(r._id, true)}><Check size={14} /> Approve</button><button className="btn-danger" onClick={() => review(r._id, false)}><X size={14} /> Reject</button></div></div>) : <p className="muted">No pending applications.</p>}</section>}
    {message && <p className="notice">{message}</p>}
    <section className="white-panel activity"><h2>GitHub activity</h2>{activity.map((a, i) => <p key={i}><GitCommitHorizontal size={15} /> {a.pusher} pushed commits to {a.branch}</p>)}{!activity.length && <p className="muted">GitHub push events will appear here after webhook setup.</p>}</section>
  </>;
}

function Admin() {
  const [users, setUsers] = useState([]), [projects, setProjects] = useState([]), [tab, setTab] = useState('users');
  async function load() { const [u, p] = await Promise.all([api.get('/admin/users'), api.get('/admin/projects')]); setUsers(u.data); setProjects(p.data); }
  useEffect(() => { load().catch(() => { }); }, []);
  async function delUser(id) { if (confirm('Deactivate this user?')) { await api.delete(`/admin/users/${id}`); load(); } }
  async function delProject(id) { if (confirm('Delete this project?')) { await api.delete(`/admin/projects/${id}`); load(); } }
  return <><PageTitle tag="PLATFORM CONTROL" title="Admin panel" desc="Manage platform users and projects." /><div className="tabs"><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users ({users.length})</button><button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Projects ({projects.length})</button></div><section className="white-panel">{tab === 'users' ? users.map(u => <div className="role-line"><div><b>{u.name}</b><small>{u.email}</small></div><button className="btn-danger" onClick={() => delUser(u._id)}><Trash2 size={14} /> Deactivate</button></div>) : projects.map(p => <div className="role-line"><div><b>{p.name}</b><small>{p.leader?.name}</small></div><button className="btn-danger" onClick={() => delProject(p._id)}>Delete</button></div>)}</section></>;
}
function AppRoutes() {
  const { user } = useAuth();
  return <Routes><Route path="/login" element={user ? <Navigate to="/" /> : <Login />} /><Route path="*" element={!user ? <Navigate to="/login" /> : <Shell><Routes><Route path="/" element={<Dashboard />} /><Route path="/discover" element={<Discover />} /><Route path="/create" element={<CreateProject />} /><Route path="/projects/:id" element={<ProjectDetails />} /><Route path="/workspace/:id" element={<Workspace />} /><Route path="/mine" element={<MyProjects />} /><Route path="/profile" element={<Profile />} /><Route path="/users/:userId" element={<PublicProfile />} /><Route path="/profile/setup" element={<Profile setup />} /><Route path="/admin" element={<Admin />} /></Routes></Shell>} /></Routes>;
}
export default function App() { return <AuthProvider><AppRoutes /></AuthProvider>; }
