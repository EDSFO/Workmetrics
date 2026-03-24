'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useAuthStore } from '@/lib/auth-context';

interface StandardTask {
  id: string;
  name: string;
  description?: string;
  estimatedHours?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface ApplyModalProps {
  task: StandardTask;
  projects: Project[];
  onClose: () => void;
  onApply: (projectId: string) => Promise<void>;
}

function ApplyModal({ task, projects, onClose, onApply }: ApplyModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!selectedProjectId) return;
    setIsApplying(true);
    await onApply(selectedProjectId);
    setIsApplying(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Aplicar Tarefa Padrão</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecione um projeto para aplicar <strong>{task.icon} {task.name}</strong>:
        </p>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        >
          <option value="">Selecione um projeto...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedProjectId || isApplying}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {isApplying ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StandardTasks() {
  const { isAdmin } = useAuthStore();
  const [tasks, setTasks] = useState<StandardTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<StandardTask | null>(null);
  const [applyModalTask, setApplyModalTask] = useState<StandardTask | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEstimatedHours, setFormEstimatedHours] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formIcon, setFormIcon] = useState('📋');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/standard-tasks');
      setTasks(response.data.standardTasks || []);
    } catch (err: any) {
      console.error('Failed to fetch standard tasks:', err);
      setError(err.response?.data?.message || 'Erro ao carregar tarefas padrão');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormEstimatedHours('');
    setFormColor('#3B82F6');
    setFormIcon('📋');
    setEditingTask(null);
    setShowForm(false);
  };

  const handleEdit = (task: StandardTask) => {
    setFormName(task.name);
    setFormDescription(task.description || '');
    setFormEstimatedHours(task.estimatedHours ? String(parseFloat(task.estimatedHours)) : '');
    setFormColor(task.color);
    setFormIcon(task.icon);
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const data = {
        name: formName,
        description: formDescription || undefined,
        estimatedHours: formEstimatedHours ? parseFloat(formEstimatedHours) : undefined,
        color: formColor,
        icon: formIcon,
      };

      let response;
      if (editingTask) {
        response = await api.put(`/standard-tasks/${editingTask.id}`, data);
      } else {
        response = await api.post('/standard-tasks', data);
      }

      if (response.data.standardTask) {
        setSuccessMessage(editingTask ? 'Tarefa padrão atualizada!' : 'Tarefa padrão criada!');
        fetchTasks();
        resetForm();
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar tarefa padrão');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa padrão?')) return;

    try {
      const response = await api.delete(`/standard-tasks/${taskId}`);
      if (response.data.message) {
        setSuccessMessage('Tarefa padrão excluída!');
        fetchTasks();
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir tarefa padrão');
    }
  };

  const handleApplyToProject = async (projectId: string) => {
    if (!applyModalTask) return;

    try {
      const response = await api.post(`/standard-tasks/${applyModalTask.id}/apply-to-project/${projectId}`);
      if (response.data.task) {
        setSuccessMessage(`Tarefa aplicada ao projeto com sucesso!`);
        setApplyModalTask(null);
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao aplicar tarefa padrão');
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-white">
        <p className="text-center text-gray-500">Apenas administradores podem gerenciar tarefas padrão.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Tarefas Padrão</h2>
          <p className="text-sm text-gray-500">Crie tarefas que podem ser reutilizadas em qualquer projeto</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          + Nova Tarefa Padrão
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ml-2 text-green-500 hover:underline">
            Fechar
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-4">{editingTask ? 'Editar Tarefa Padrão' : 'Nova Tarefa Padrão'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Desenvolvimento"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Horas Estimadas</label>
                <input
                  type="number"
                  step="0.5"
                  value={formEstimatedHours}
                  onChange={(e) => setFormEstimatedHours(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Descrição opcional..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cor</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ícone</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="📋"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando tarefas padrão...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border">
          Nenhuma tarefa padrão criada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              style={{ borderLeftColor: task.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{task.icon}</span>
                  <div>
                    <h4 className="font-medium">{task.name}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-500">{task.description}</p>
                    )}
                    {task.estimatedHours && (
                      <p className="text-xs text-gray-400 mt-1">
                        {parseFloat(task.estimatedHours)}h estimadas
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setApplyModalTask(task)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Aplicar a Projeto
                  </button>
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply to Project Modal */}
      {applyModalTask && (
        <ApplyModal
          task={applyModalTask}
          projects={projects}
          onClose={() => setApplyModalTask(null)}
          onApply={handleApplyToProject}
        />
      )}
    </div>
  );
}
