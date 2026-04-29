import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Kanban, Database, CheckSquareOffset, Plus, UploadSimple, Users, Trash, ShieldStar } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { toast } from 'sonner';
import { Badge } from '../components/Badge';
import { Task, Role, Asset } from '../types';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { AddTeamMemberModal } from '../components/AddTeamMemberModal';
import { AssetDetailsModal } from '../components/AssetDetailsModal';
import { ManageRolesModal } from '../components/ManageRolesModal';
import { useRole } from '../hooks/useRole';
import { api } from '../lib/api';

type TeamTab = 'tasks' | 'content' | 'review' | 'team';

export function TeamView() {
  const { language, assets, clips, tasks, teamMembers, customRoles, updateTeamMemberRole, removeTeamMember, setCurrentView, setTeamMembers } = useAppStore();
  const rawRole = useRole();
  const currentRole = customRoles.find(r => r.id === rawRole) || customRoles.find(r => r.id === 'viewer');
  // For simplicity, anyone who has 'team' access and their role id isn't 'viewer' can maybe manage this, but let's say 'admin' id.
  const isAdmin = currentRole?.id === 'admin';

  useEffect(() => {
    api.get<any[]>('/api/users')
      .then(data => {
        if (Array.isArray(data)) {
          setTeamMembers(data);
        }
      })
      .catch(e => console.error("Could not fetch team members:", e));
  }, []);

  const [activeTab, setActiveTab] = useState<TeamTab>('tasks');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isManageRolesModalOpen, setIsManageRolesModalOpen] = useState(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState<Task['status']>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const updateMemberRole = (id: string, newRole: Role) => {
    if (!isAdmin) return; // Only admins can update roles
    updateTeamMemberRole(id, newRole);
  };

  const handleRemoveMember = (id: string) => {
    if (!isAdmin) return;
    if (confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir retirer ce membre ?' : 'Are you sure you want to remove this member?')) {
      removeTeamMember(id);
    }
  };

  const renderTeam = () => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)] gap-2">
        <h3 className="font-semibold text-[var(--text-main)] flex items-center gap-2">
          <Users size={20} />
          {language === 'fr' ? 'Membres de l\'équipe' : 'Team Members'}
        </h3>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsManageRolesModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)] text-sm font-medium rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <ShieldStar size={16} />
              Manage Roles
            </button>
            <button 
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--text-main)] text-[var(--surface)] text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus size={16} />
              {language === 'fr' ? 'Ajouter un membre' : 'Add Member'}
            </button>
          </div>
        )}
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--hover-bg)]">
            <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Member</th>
            <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Email</th>
            <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Role</th>
            {isAdmin && <th className="p-4 w-16"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {teamMembers.map(member => (
            <tr key={member.id} className="hover:bg-[var(--hover-bg)] transition-colors">
              <td className="p-4 font-medium text-[var(--text-main)]">{member.name}</td>
              <td className="p-4 text-sm text-[var(--text-muted)]">{member.email}</td>
              <td className="p-4">
                {isAdmin ? (
                  <select 
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.id, e.target.value as Role)}
                    className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--text-main)] outline-none"
                  >
                    {customRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-[var(--text-main)] capitalize">{customRoles.find(r => r.id === member.role)?.name || member.role}</span>
                )}
              </td>
              {isAdmin && (
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove member"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTasks = () => {
    const columns: { id: Task['status']; title: string }[] = [
      { id: 'todo', title: 'To Do' },
      { id: 'in-progress', title: 'In Progress' },
      { id: 'review', title: 'In Review' },
      { id: 'done', title: 'Done' },
    ];

    const filteredTasks = tasks.filter(t => taskPriorityFilter === 'all' || (t.priority || 'medium') === taskPriorityFilter);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-muted)]">Priority:</span>
            <select
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
              className="bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border)] rounded px-3 py-1.5 text-sm outline-none w-32"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 h-full">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--text-main)]">{col.title}</h3>
                  <span className="text-xs font-medium bg-[var(--hover-bg)] text-[var(--text-muted)] px-2 py-1 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {colTasks.map(task => {
                    const assigneeMember = teamMembers.find(m => m.id === task.assignee);
                    const assigneeName = assigneeMember ? assigneeMember.name : task.assignee;
                    const priorityScore = task.priority === 'high' ? 3 : task.priority === 'low' ? 1 : 2;
                    const priorityColor = task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

                    return (
                    <div 
                      key={task.id} 
                      onClick={() => {
                        setSelectedTask(task);
                        setIsEditTaskModalOpen(true);
                      }}
                      className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-sm font-medium text-[var(--text-main)]">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold shrink-0 ${priorityColor}`}>
                          {task.priority || 'medium'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {assigneeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">{assigneeName}</span>
                        </div>
                        {task.dueDate && (
                          <span className="text-xs text-[var(--text-muted)]">{task.dueDate}</span>
                        )}
                      </div>
                    </div>
                  )})}
                  <button 
                    onClick={() => {
                      setInitialTaskStatus(col.id);
                      setIsAddTaskModalOpen(true);
                    }}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors border border-dashed border-[var(--border)]"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--hover-bg)]">
              <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Asset</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Client</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {assets.map(asset => (
              <tr 
                key={asset.id} 
                onClick={() => {
                  setSelectedAsset(asset);
                  setIsAssetModalOpen(true);
                }}
                className="hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              >
                <td className="p-4">
                  <div className="font-medium text-[var(--text-main)]">{asset.title}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">{asset.campaign}</div>
                </td>
                <td className="p-4"><Badge status={asset.status} /></td>
                <td className="p-4 text-sm text-[var(--text-main)]">{asset.client}</td>
                <td className="p-4 text-sm text-[var(--text-muted)] font-mono">{asset.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6 overflow-y-auto h-full pb-10">
      <div className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--hover-bg)] flex items-center justify-center text-[var(--text-muted)] mb-4">
          <UploadSimple size={24} />
        </div>
        <h3 className="text-lg font-medium text-[var(--text-main)] mb-2">Drop video for review</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mb-6">
          Upload your edited clips here. The team leader will review them and provide feedback.
        </p>
        <label className="px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center justify-center">
          Select Video
          <input 
            type="file" 
            className="hidden" 
            accept="video/*" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                 toast.success('Clip uploaded for review!', { duration: 3000 });
              }
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map(clip => (
          <div key={clip.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-video bg-gray-100 relative">
              <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                {clip.duration}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-[var(--text-main)] line-clamp-2">{clip.title}</h4>
                <div className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                  clip.status === 'approved' ? 'bg-green-100 text-green-700' :
                  clip.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {clip.status}
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4 flex-1">{clip.platform}</p>
              <button 
                onClick={() => {
                   // When we want to view feedback, navigate to the main ClipReview module where feedback happens
                   setCurrentView('review');
                }}
                className="w-full py-2 bg-[var(--hover-bg)] text-[var(--text-main)] rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                View Feedback
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">Team Workspace</h1>
        <p className="text-[var(--text-muted)]">Collaborate on tasks, access content, and review clips.</p>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tasks' ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Kanban size={18} />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'content' ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Database size={18} />
          Content Database
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'review' ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <CheckSquareOffset size={18} />
          Clip Review
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'team' ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Users size={18} />
          Team
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'content' && renderContent()}
          {activeTab === 'review' && renderReview()}
          {activeTab === 'team' && renderTeam()}
        </motion.div>
      </div>

      <AddTaskModal 
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        status={initialTaskStatus}
      />
      {selectedTask && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={() => setIsEditTaskModalOpen(false)}
          task={selectedTask}
        />
      )}
      <AddTeamMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
      />
      <AssetDetailsModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        asset={selectedAsset}
      />
      <ManageRolesModal
        isOpen={isManageRolesModalOpen}
        onClose={() => setIsManageRolesModalOpen(false)}
      />
    </div>
  );
}
