'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useAuthStore } from '@/lib/auth-context';
import Link from 'next/link';

// Types
interface Team {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  team?: Team;
  budgetHours?: string;
  budgetAmount?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  projectId: string;
  name: string;
  estimatedHours?: string;
  createdAt: string;
  updatedAt: string;
  totalTrackedSeconds?: number;
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProjectsPage() {
  const { user, isAdmin, isManager } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    teamId: '',
    budgetHours: '',
    budgetAmount: '',
  });

  const [taskForm, setTaskForm] = useState({
    name: '',
    estimatedHours: '',
  });

  // Check if user can manage projects
  const canManageProjects = isAdmin() || isManager();

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects');
      // Filter out archived projects by default for non-admin users
      let projectList = response.data.projects || [];
      if (!isAdmin()) {
        projectList = projectList.filter((p: Project) => !p.archived);
      }
      setProjects(projectList);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Fetch teams (for admin)
  const fetchTeams = useCallback(async () => {
    if (!isAdmin()) return;
    try {
      const response = await api.get('/team/all');
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  }, [isAdmin]);

  // Fetch tasks for selected project
  const fetchTasks = useCallback(async (projectId: string) => {
    setIsLoadingTasks(true);
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      setTasks(response.data.tasks || []);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, [fetchProjects, fetchTeams]);

  // Handle project selection
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    fetchTasks(project.id);
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Handle create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createData = {
        name: projectForm.name,
        description: projectForm.description || undefined,
        teamId: isAdmin() ? projectForm.teamId : undefined,
        budgetHours: projectForm.budgetHours ? parseFloat(projectForm.budgetHours) : undefined,
        budgetAmount: projectForm.budgetAmount ? parseFloat(projectForm.budgetAmount) : undefined,
      };

      const response = await api.post('/projects', createData);
      if (response.data.project) {
        setProjects([response.data.project, ...projects]);
        setShowCreateForm(false);
        setProjectForm({ name: '', description: '', teamId: '', budgetHours: '', budgetAmount: '' });
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  // Handle update project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const updateData = {
        name: projectForm.name || undefined,
        description: projectForm.description || undefined,
        budgetHours: projectForm.budgetHours ? parseFloat(projectForm.budgetHours) : undefined,
        budgetAmount: projectForm.budgetAmount ? parseFloat(projectForm.budgetAmount) : undefined,
      };

      const response = await api.put(`/projects/${editingProject.id}`, updateData);
      if (response.data.project) {
        setProjects(projects.map(p => p.id === editingProject.id ? response.data.project : p));
        setEditingProject(null);
        setProjectForm({ name: '', description: '', teamId: '', budgetHours: '', budgetAmount: '' });
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to update project:', err);
      setError(err.response?.data?.message || 'Failed to update project');
    }
  };

  // Handle archive project
  const handleArchiveProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja arquivar este projeto?')) return;

    try {
      const response = await api.delete(`/projects/${projectId}`);
      if (response.data.project) {
        setProjects(projects.filter(p => p.id !== projectId));
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setTasks([]);
        }
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to archive project:', err);
      setError(err.response?.data?.message || 'Failed to archive project');
    }
  };

  // Handle create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const createData = {
        name: taskForm.name,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
      };

      const response = await api.post(`/tasks/project/${selectedProject.id}`, createData);
      if (response.data.task) {
        setTasks([response.data.task, ...tasks]);
        setShowTaskForm(false);
        setTaskForm({ name: '', estimatedHours: '' });
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  // Handle update task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const updateData = {
        name: taskForm.name || undefined,
        estimatedHours: taskForm.estimatedHours ? parseFloat(taskForm.estimatedHours) : undefined,
      };

      const response = await api.put(`/tasks/${editingTask.id}`, updateData);
      if (response.data.task) {
        setTasks(tasks.map(t => t.id === editingTask.id ? response.data.task : t));
        setEditingTask(null);
        setTaskForm({ name: '', estimatedHours: '' });
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to update task:', err);
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.message) {
        setTasks(tasks.filter(t => t.id !== taskId));
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Start editing project
  const startEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      teamId: project.teamId,
      budgetHours: project.budgetHours || '',
      budgetAmount: project.budgetAmount || '',
    });
    setShowCreateForm(false);
  };

  // Start editing task
  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      estimatedHours: task.estimatedHours || '',
    });
    setShowTaskForm(false);
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Por favor, faça login</h1>
        <p className="text-lg text-muted-foreground">
          Você precisa fazer login para acessar esta página
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-500 hover:underline">
              ← Voltar
            </Link>
            <h1 className="text-3xl font-bold">Projetos</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie projetos e tarefas da sua equipe
          </p>
        </div>
        {canManageProjects && (
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingProject(null);
              setProjectForm({ name: '', description: '', teamId: '', budgetHours: '', budgetAmount: '' });
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            + Novo Projeto
          </button>
        )}
      </header>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Create/Edit Project Form */}
      {showCreateForm && canManageProjects && (
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4">Criar Novo Projeto</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Projeto *</label>
              <input
                type="text"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Meu Novo Projeto"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva o projeto..."
              />
            </div>
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium mb-1">Equipe *</label>
                <select
                  value={projectForm.teamId}
                  onChange={(e) => setProjectForm({ ...projectForm, teamId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione uma equipe</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Horas Orçadas</label>
                <input
                  type="number"
                  step="0.1"
                  value={projectForm.budgetHours}
                  onChange={(e) => setProjectForm({ ...projectForm, budgetHours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor Orçado</label>
                <input
                  type="number"
                  step="0.01"
                  value={projectForm.budgetAmount}
                  onChange={(e) => setProjectForm({ ...projectForm, budgetAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000.00"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Criar Projeto
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setProjectForm({ name: '', description: '', teamId: '', budgetHours: '', budgetAmount: '' });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Project Form */}
      {editingProject && canManageProjects && (
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4">Editar Projeto</h2>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Projeto *</label>
              <input
                type="text"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Horas Orçadas</label>
                <input
                  type="number"
                  step="0.1"
                  value={projectForm.budgetHours}
                  onChange={(e) => setProjectForm({ ...projectForm, budgetHours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor Orçado</label>
                <input
                  type="number"
                  step="0.01"
                  value={projectForm.budgetAmount}
                  onChange={(e) => setProjectForm({ ...projectForm, budgetAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Salvar Alterações
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setProjectForm({ name: '', description: '', teamId: '', budgetHours: '', budgetAmount: '' });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Column */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Todos os Projetos</h2>
          {isLoading && (
            <div className="text-center py-8 text-gray-500">Carregando projetos...</div>
          )}
          {!isLoading && projects.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
              Nenhum projeto encontrado. {canManageProjects && 'Crie seu primeiro projeto!'}
            </div>
          )}
          {!isLoading && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Equipe: {project.team?.name || 'Desconhecida'}
                      </p>
                    </div>
                    {canManageProjects && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditProject(project);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors"
                          title="Arquivar"
                        >
                          📁
                        </button>
                      </div>
                    )}
                  </div>
                  {project.budgetHours && (
                    <p className="text-xs text-gray-400 mt-2">
                      Orçamento: {project.budgetHours}h
                      {project.budgetAmount && ` / R$ ${project.budgetAmount}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Column */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Tarefas: {selectedProject.name}
                </h2>
                {canManageProjects && (
                  <button
                    onClick={() => {
                      setShowTaskForm(true);
                      setEditingTask(null);
                      setTaskForm({ name: '', estimatedHours: '' });
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
                  >
                    + Nova Tarefa
                  </button>
                )}
              </div>

              {/* Create/Edit Task Form */}
              {showTaskForm && canManageProjects && (
                <div className="mb-6 p-4 border rounded-lg shadow-sm bg-white">
                  <h3 className="font-semibold mb-3">Criar Nova Tarefa</h3>
                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome da Tarefa *</label>
                      <input
                        type="text"
                        value={taskForm.name}
                        onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Minha nova tarefa"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Horas Estimadas</label>
                      <input
                        type="number"
                        step="0.1"
                        value={taskForm.estimatedHours}
                        onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="8"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors">
                        Criar Tarefa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTaskForm(false);
                          setTaskForm({ name: '', estimatedHours: '' });
                        }}
                        className="px-3 py-1 border rounded hover:bg-gray-100 text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit Task Form */}
              {editingTask && canManageProjects && (
                <div className="mb-6 p-4 border rounded-lg shadow-sm bg-white">
                  <h3 className="font-semibold mb-3">Editar Tarefa</h3>
                  <form onSubmit={handleUpdateTask} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome da Tarefa *</label>
                      <input
                        type="text"
                        value={taskForm.name}
                        onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Horas Estimadas</label>
                      <input
                        type="number"
                        step="0.1"
                        value={taskForm.estimatedHours}
                        onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors">
                        Salvar Alterações
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(null);
                          setTaskForm({ name: '', estimatedHours: '' });
                        }}
                        className="px-3 py-1 border rounded hover:bg-gray-100 text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tasks List */}
              {isLoadingTasks ? (
                <div className="text-center py-8 text-gray-500">Carregando tarefas...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
                  Nenhuma tarefa encontrada. {canManageProjects && 'Crie sua primeira tarefa!'}
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => {
                    const trackedHours = (task.totalTrackedSeconds || 0) / 3600;
                    const estimatedHours = parseFloat(task.estimatedHours || '0');
                    const progress = estimatedHours > 0 ? Math.min(100, (trackedHours / estimatedHours) * 100) : 0;

                    return (
                      <div
                        key={task.id}
                        className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium">{task.name}</h4>
                            <div className="flex gap-4 mt-1">
                              {task.estimatedHours && (
                                <p className="text-sm text-gray-500">
                                  Est: {task.estimatedHours}h
                                </p>
                              )}
                              <p className={`text-sm ${trackedHours > estimatedHours && estimatedHours > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                Rastreadas: {trackedHours.toFixed(1)}h
                              </p>
                            </div>
                            {/* Progress bar */}
                            {estimatedHours > 0 && (
                              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden w-48">
                                <div
                                  className={`h-full transition-all ${trackedHours > estimatedHours ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Criado em: {formatDate(task.createdAt)}
                            </p>
                          </div>
                          {canManageProjects && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditTask(task)}
                                className="p-2 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
              Selecione um projeto para ver suas tarefas
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
