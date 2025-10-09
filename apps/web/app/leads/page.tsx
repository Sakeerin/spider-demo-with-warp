"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Placeholder data until the API is ready
const leadsData = [
  {
    id: "1",
    accountLead: "AL-22-09-201",
    company: "Fusion Solution",
    contactName: "Seksan Dujdevireoj",
    sales: "Seksan Dujdevireoj",
    jobStatus: "First Contact",
    followUpDate: "2022-10-03",
    productType: "Solar Panel",
    active: true,
  },
  {
    id: "2",
    accountLead: "AL-22-09-202",
    company: "Creative Innovations",
    contactName: "Jane Doe",
    sales: "Jane Doe",
    jobStatus: "Follow Up",
    followUpDate: "2022-10-05",
    productType: "EV Charger",
    active: true,
  },
  {
    id: "3",
    accountLead: "AL-22-09-203",
    company: "Tech Giants Inc.",
    contactName: "John Smith",
    sales: "John Smith",
    jobStatus: "Negotiating",
    followUpDate: "2022-10-10",
    productType: "Smart Home Automation",
    active: false,
  },
];

export default function LeadsDashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLeads = leadsData
    .filter((lead) =>
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.sales.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((lead) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "active") return lead.active;
      if (filterStatus === "inactive") return !lead.active;
      return true;
    });

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Lead Management</h1>
        <Link href="/leads/create">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            + New Lead
          </button>
        </Link>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search by company, contact, or sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-1/3"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Not Active</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b">Account Lead</th>
              <th className="py-2 px-4 border-b">Company</th>
              <th className="py-2 px-4 border-b">Contact Name</th>
              <th className="py-2 px-4 border-b">Sales</th>
              <th className="py-2 px-4 border-b">Job Status</th>
              <th className="py-2 px-4 border-b">Follow-up Date</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{lead.accountLead}</td>
                <td className="py-2 px-4 border-b">{lead.company}</td>
                <td className="py-2 px-4 border-b">{lead.contactName}</td>
                <td className="py-2 px-4 border-b">{lead.sales}</td>
                <td className="py-2 px-4 border-b">{lead.jobStatus}</td>
                <td className="py-2 px-4 border-b">{lead.followUpDate}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    lead.active ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                  }`}>
                    {lead.active ? "Active" : "Not Active"}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <button onClick={() => router.push(`/leads/${lead.id}`)} className="text-blue-500 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}