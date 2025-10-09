"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// Placeholder data until the API is ready
const leadsData = [
  {
    id: "1",
    accountLead: "AL-22-09-201",
    contactDate: "2022-09-26",
    company: "Fusion Solution",
    contactName: "Seksan Dujdevireoj",
    contactPhone: "02-xxxx-xxxx",
    mobilePhone: "08x-xxx-xxxx",
    email: "seksan@fusion.co.th",
    channel: "Website",
    sales: "Seksan Dujdevireoj",
    jobStatus: "First Contact",
    followUpDate: "2022-10-03",
    jobDetail: "Initial inquiry about solar panel installation for a commercial building.",
    productType: "Solar Panel",
    adType: "Google Ads",
    remark: "High-value lead, requires quick follow-up.",
    active: true,
  },
];

const salesReps = ["Seksan Dujdevireoj", "Jane Doe", "John Smith", "Peter Jones"];

const initialActivities = [
    { id: 1, type: 'NOTE', message: 'Called customer, interested in a quote.', createdBy: 'Seksan Dujdevireoj', createdAt: '2022-09-28 10:30' },
    { id: 2, type: 'STATUS_CHANGE', message: 'Status changed to "Follow Up"', createdBy: 'System', createdAt: '2022-09-29 11:00' },
    { id: 3, type: 'ASSIGNMENT', message: 'Lead assigned to Jane Doe', createdBy: 'Admin', createdAt: '2022-09-30 09:00' },
];

const initialTasks = [
    { id: 1, title: 'Send follow-up email with brochure', completed: true },
    { id: 2, title: 'Schedule a call for next week', completed: false },
];

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [lead, setLead] = useState(null);
  const [newSales, setNewSales] = useState("");
  const [activities, setActivities] = useState(initialActivities);
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (id) {
      const foundLead = leadsData.find((l) => l.id === id);
      setLead(foundLead);
      if (foundLead) {
        setNewSales(foundLead.sales);
      }
    }
  }, [id]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      console.log(`Deleting lead with ID: ${id}`);
      alert("Lead deleted successfully! (placeholder)");
      router.push("/leads");
    }
  };

  const handleAssignLead = () => {
    if (!newSales) {
      alert("Please select a sales representative.");
      return;
    }
    setLead((prev) => ({ ...prev, sales: newSales }));
    alert(`Lead assigned to ${newSales} successfully! (placeholder)`);
  };

  const handleAddTask = () => {
    if (newTask.trim() === '') return;
    const newTaskObj = { id: Date.now(), title: newTask, completed: false };
    setTasks([...tasks, newTaskObj]);
    setNewTask('');
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  };


  if (!lead) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Lead Details</h1>
        <div className="flex space-x-2">
          <Link href={`/leads/${id}/edit`}>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">
              Edit
            </button>
          </Link>
          <button onClick={handleDelete} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            {/* Customer, Sales, Product Details */}
            <div>
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Customer Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Account Lead:</strong> {lead.accountLead}</p>
                    <p><strong>Contact Date:</strong> {lead.contactDate}</p>
                    <p><strong>Company:</strong> {lead.company}</p>
                    <p><strong>Contact Name:</strong> {lead.contactName}</p>
                    <p><strong>Contact Phone:</strong> {lead.contactPhone}</p>
                    <p><strong>Mobile Phone:</strong> {lead.mobilePhone}</p>
                    <p><strong>E-mail:</strong> {lead.email}</p>
                    <p><strong>Channel:</strong> {lead.channel}</p>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Sales Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Sales Rep:</strong> {lead.sales}</p>
                    <p><strong>Job Status:</strong> {lead.jobStatus}</p>
                    <p><strong>Follow-up Date:</strong> {lead.followUpDate}</p>
                    <p className="md:col-span-2"><strong>Job Detail:</strong> {lead.jobDetail}</p>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Product Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Product Type:</strong> {lead.productType}</p>
                    <p><strong>Ad-Type:</strong> {lead.adType}</p>
                    <p className="md:col-span-2"><strong>Remark:</strong> {lead.remark}</p>
                </div>
            </div>
          </div>
          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Activity Feed</h2>
            <div className="space-y-4">
                {activities.map(activity => (
                    <div key={activity.id} className="text-sm">
                        <p className="font-bold">{activity.type.replace('_', ' ')}</p>
                        <p>{activity.message}</p>
                        <p className="text-gray-500">by {activity.createdBy} at {activity.createdAt}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Lead Assignment</h2>
            <div className="space-y-4">
              <label htmlFor="sales-assignment" className="block font-medium">Assign to:</label>
              <select id="sales-assignment" value={newSales} onChange={(e) => setNewSales(e.target.value)} className="p-2 border rounded w-full">
                <option value="">Select a Sales Rep</option>
                {salesReps.map(rep => (<option key={rep} value={rep}>{rep}</option>))}
              </select>
              <button onClick={handleAssignLead} className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Re-assign Lead</button>
            </div>
          </div>
          {/* Follow-up Tasks */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Follow-up Tasks</h2>
            <div className="space-y-2">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleTaskCompletion(task.id)} className="mr-2"/>
                        <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.title}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex">
                <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new task" className="p-2 border rounded-l w-full"/>
                <button onClick={handleAddTask} className="bg-blue-500 text-white p-2 rounded-r">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}