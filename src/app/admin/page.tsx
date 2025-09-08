
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, EyeOff, Edit } from "lucide-react";

interface User {
  users: string;
  expires_at: string;
}

interface Trial {
  hwid: string;
  expires_at: number;
}

type ExpiryType = "days" | "weeks" | "months";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [expiryType, setExpiryType] = useState<ExpiryType>("days");
  const [expiryValue, setExpiryValue] = useState<string>("30");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editExpiryType, setEditExpiryType] = useState<ExpiryType>("days");
  const [editExpiryValue, setEditExpiryValue] = useState<string>("");
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchData = async (adminToken: string) => {
    try {
      const usersRes = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${adminToken}` } });
      const trialsRes = await fetch("/api/admin/trials", { headers: { Authorization: `Bearer ${adminToken}` } });
      
      if (!usersRes.ok || !trialsRes.ok) {
        console.error("Failed to fetch data, logging out.");
        handleLogout();
        return;
      }

      const usersData = await usersRes.json();
      const trialsData = await trialsRes.json();
      
      setUsers(usersData.users || []);
      setTrials(trialsData.trials || []);

    } catch (error) {
      console.error("Failed to fetch data", error);
      handleLogout();
    }
  };
  
  useEffect(() => {
    const storedToken = localStorage.getItem("nyx_admin_token");
    if (storedToken) {
      setToken(storedToken);
      fetchData(storedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.status === "success") {
      localStorage.setItem("nyx_admin_token", data.token);
      setToken(data.token);
      fetchData(data.token);
    } else {
      alert("Admin login failed: " + data.message);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("nyx_admin_token");
    setToken(null);
    setUsers([]);
    setTrials([]);
  };

  const calculateExpiry = (type: ExpiryType, valueStr: string): number | null => {
    const value = parseInt(valueStr, 10);
    if (isNaN(value) || value <= 0) return null;

    const now = new Date();
    switch (type) {
        case "days":
            now.setDate(now.getDate() + value);
            break;
        case "weeks":
            now.setDate(now.getDate() + value * 7);
            break;
        case "months":
            now.setMonth(now.getMonth() + value);
            break;
    }
    return now.getTime();
  }
  
  const calculateExtension = (type: ExpiryType, valueStr: string): { type: ExpiryType, value: number } | null => {
      const value = parseInt(valueStr, 10);
      if (isNaN(value) || value <= 0) return null;
      return { type, value };
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const finalExpiresAt = calculateExpiry(expiryType, expiryValue);
    if (!finalExpiresAt) {
        alert("Please enter a valid expiry value.");
        return;
    }
    
    const body = { username: newUsername, password: newPassword, expiresAt: finalExpiresAt };
    
    const res = await fetch(`/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      alert("User created");
      setNewUsername("");
      setNewPassword("");
      setExpiryType("days");
      setExpiryValue("30");
      fetchData(token);
    } else {
      const data = await res.json();
      alert("Create failed: " + (data.message || "An unknown error occurred."));
    }
  };

  const confirmDeleteUser = async () => {
    if (!token || !deletingUser) return;
    
    const res = await fetch(`/api/admin/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: deletingUser.users }),
    });

    if (res.ok) {
      alert("User deleted");
      fetchData(token);
    } else {
      const data = await res.json();
      alert("Delete failed: " + (data.message || "An unknown error occurred."));
    }
    
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
  };
  
  const handleOpenDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditExpiryType('days');
    setEditExpiryValue('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUserExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;
    
    const extension = calculateExtension(editExpiryType, editExpiryValue);
    if (!extension) {
        alert("Please enter a valid value for the extension.");
        return;
    }

    const body = { username: editingUser.users, extension };

    const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        alert('User expiry updated successfully');
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchData(token);
    } else {
        const data = await res.json();
        alert('Update failed: ' + (data.message || 'An unknown error occurred.'));
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">NyX Admin Panel</h1>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username">Username</Label>
                  <Input id="new-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input id="new-password" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <div className="flex gap-2 items-center">
                      <select
                          value={expiryType}
                          onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                          <option value="days">In Days</option>
                          <option value="weeks">In Weeks</option>
                          <option value="months">In Months</option>
                      </select>
                  </div>
                  <div className="pt-2">
                    <Input
                        id="expiry-value"
                        type="number"
                        min="1"
                        placeholder={`Number of ${expiryType}`}
                        value={expiryValue}
                        onChange={(e) => setExpiryValue(e.target.value)}
                        required
                        />
                  </div>
                </div>
                <Button type="submit" className="w-full">Create User</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Username</th>
                    <th className="text-left p-2">Expires</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.users} className="border-b">
                      <td className="p-2">{user.users}</td>
                      <td className="p-2">{user.expires_at}</td>
                      <td className="p-2 text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(user)}>
                           <Edit className="h-4 w-4 text-blue-400"/>
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteModal(user)}>
                           <Trash2 className="h-4 w-4 text-destructive"/>
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

         <Card className="mt-6">
            <CardHeader>
              <CardTitle>Trial Usage ({trials.length})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[40vh] overflow-y-auto">
               <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">HWID</th>
                    <th className="text-left p-2">Expires At</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((trial) => (
                    <tr key={trial.hwid} className="border-b">
                      <td className="p-2 font-mono text-xs">{trial.hwid}</td>
                      <td className="p-2">{new Date(trial.expires_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
      </div>

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Edit Expiry for {editingUser.users}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateUserExpiry} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Current Expiry: {editingUser.expires_at}</Label>
                          <Label>Add Time</Label>
                          <div className="flex gap-2 items-center">
                              <select
                                  value={editExpiryType}
                                  onChange={(e) => {
                                      setEditExpiryType(e.target.value as ExpiryType);
                                      setEditExpiryValue('');
                                  }}
                                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              >
                                  <option value="days">Add Days</option>
                                  <option value="weeks">Add Weeks</option>
                                  <option value="months">Add Months</option>
                              </select>
                          </div>
                           <div className="pt-2">
                             <Input
                                id="edit-expiry-value"
                                type="number"
                                min="1"
                                placeholder={`Number of ${editExpiryType}`}
                                value={editExpiryValue}
                                onChange={(e) => setEditExpiryValue(e.target.value)}
                                required
                                />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                           <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                           <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
      )}

      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Confirm Deletion</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Are you sure you want to delete user: <span className="font-bold">{deletingUser.users}</span>?</p>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>Delete User</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
