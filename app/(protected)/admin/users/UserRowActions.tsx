'use client';

import { useState } from 'react';
import { resetUserPassword, deleteUser, updateUserRole } from '../actions';
import { Trash2, KeyRound, Loader2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserRowActions({ 
  userId, 
  currentRole 
}: { 
  userId: string; 
  currentRole: string; 
}) {
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsResetting(true);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('newPassword', newPassword);
    
    const result = await resetUserPassword(formData);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Password updated successfully!');
      setShowResetModal(false);
      setNewPassword('');
    }
    setIsResetting(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.append('userId', userId);
    
    const result = await deleteUser(formData);
    
    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
      setShowDeleteModal(false);
    } else {
      toast.success('User deleted successfully.');
      // The component will disappear as the page revalidates
    }
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setIsUpdatingRole(true);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('role', newRole);
    
    const result = await updateUserRole(formData);
    
    if (result?.error) {
      toast.error(result.error);
      e.target.value = currentRole;
    } else {
      toast.success('Role updated!');
    }
    setIsUpdatingRole(false);
  };

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowResetModal(true)}
            disabled={isResetting || isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            title="Reset Password"
          >
            {isResetting ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Reset
          </button>

          {currentRole !== 'ADMIN' && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting || isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              title="Delete User"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>

        {currentRole !== 'ADMIN' && (
          <select 
            defaultValue={currentRole}
            onChange={handleRoleChange}
            disabled={isUpdatingRole}
            className="mt-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded p-1 outline-none focus:border-brand-500 disabled:opacity-50"
          >
            <option value="BROKER">Make Broker</option>
            <option value="CARRIER">Make Carrier</option>
            <option value="DRIVER">Make Driver</option>
          </select>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="bg-white whitespace-normal rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-bold text-lg">Delete User Account</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Are you absolutely sure you want to permanently delete this user? This action cannot be undone and all associated data will be removed from the system.
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors text-sm flex items-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 text-left">
          <div className="bg-white whitespace-normal rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 text-brand-600">
                <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center border border-brand-100">
                  <KeyRound size={20} />
                </div>
                <h3 className="font-bold text-lg">Reset Password</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Enter a new secure password for this user. They will use this new password to log in.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. NewPass123!"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={isResetting}
                  className="px-4 py-2 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isResetting || newPassword.length < 6}
                  className="px-4 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                  {isResetting && <Loader2 size={16} className="animate-spin" />}
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
