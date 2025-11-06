"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Eye, Settings, CheckCircle2, XCircle, ExternalLink, Copy, ArrowUpRight } from "lucide-react"
import cronstrue from "cronstrue"
import parser from "cron-parser"
import { useToast } from "@/components/ui/toast"
import { ReportViewer } from "@/components/report-viewer"
import { RefreshButton } from "@/components/refresh-button"

interface V0Report {
  report_id: string
  report_name: string
  client_name: string
  sub_domain: string
  uuid: string
  is_active: boolean
}

// Mock data based on the provided JSON structure
const mockClients = [
  {
    name: "Arcfil",
    db_name: "Arcfil",
    ga_name: "Arcfil",
    docker_version: "0.7.1",
    cron: { expression: "0 7,15 * * *", timezone: "America/Toronto" },
    reports: [
      {
        type: "powerbi",
        name: "Arcfil",
        group_id: "eaf9fc56-bf8d-41ca-91d0-e02835b73823",
        dataset_id: "8f676918-21ae-4520-bb92-7d82c36b6430",
      },
    ],
    toggles: ["part_events"],
  },
  {
    name: "TechCorp",
    db_name: "TechCorp",
    ga_name: "TechCorp",
    docker_version: "0.8.2",
    cron: { expression: "0 9 * * *", timezone: "America/New_York" },
    reports: [
      { type: "powerbi", name: "TechCorp Main", group_id: "abc123-def456-ghi789", dataset_id: "xyz789-uvw456-rst123" },
      {
        type: "powerbi",
        name: "TechCorp Analytics",
        group_id: "def456-ghi789-jkl012",
        dataset_id: "uvw456-rst123-mno345",
      },
    ],
    toggles: ["part_events", "custom"],
  },
]

const timezones = [
  "America/Toronto",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
]

const availableToggles = [
  { value: "part_events", label: "Part Events" },
  { value: "performance_loss", label: "Performance Loss" },
  { value: "custom", label: "Custom" },
]

export default function AirflowManagement() {
  const { showToast } = useToast()
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [clientData, setClientData] = useState<any>(null)
  const [newReport, setNewReport] = useState({ name: "", group_id: "", dataset_id: "" })
  const [showAddReport, setShowAddReport] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [showHomemadeReportsConfig, setShowHomemadeReportsConfig] = useState(false)
  const [v0Reports, setV0Reports] = useState<V0Report[]>([])
  const [loadingV0Reports, setLoadingV0Reports] = useState(false)
  const [availableReports, setAvailableReports] = useState<{ id: string, name: string, sub_domain: string }[]>([]) // Available reports from Reports table
  const [tempUuids, setTempUuids] = useState<Record<string, string>>({})
  const [activeView, setActiveView] = useState<"dashboard" | "report-viewer">("dashboard")
  const [selectedReport, setSelectedReport] = useState<{
    reportId: string
    clientId: string
    uuid: string
    reportName: string
    clientName: string
    subdomain: string
  } | null>(null)

  // Fetch clients from database
  const fetchClients = async (forceRefresh = false) => {
    try {
      setLoadingClients(true)
      // Add timestamp to bypass cache when forceRefresh is true
      const url = forceRefresh 
        ? `/api/clients?refresh=${Date.now()}`
        : `/api/clients`
      
      const response = await fetch(url, {
        cache: forceRefresh ? 'no-store' : 'default',
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }
      
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      // Fallback to mock data if API fails
      setClients(mockClients)
    } finally {
      setLoadingClients(false)
    }
  }

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Fetch all available v0 reports from Reports table
  const fetchAvailableReports = async (forceRefresh = false) => {
    try {
      const url = forceRefresh
        ? `/api/v0-reports/available?refresh=${Date.now()}`
        : `/api/v0-reports/available`
      
      const response = await fetch(url, {
        cache: forceRefresh ? 'no-store' : 'default',
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableReports(data.reports || [])
      }
    } catch (error) {
      console.error("Error fetching available v0 reports:", error)
    }
  }

  // Fetch available reports on component mount
  useEffect(() => {
    fetchAvailableReports()
  }, [])

  // Function to fetch reports for a specific client
  const fetchClientReports = async (clientId: string) => {
    try {
      setLoadingReports(true)
      // Add timestamp to prevent caching in production
      const response = await fetch(`/api/clients/${clientId}/reports?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch client reports")
      }
      
      const data = await response.json()
      const reports = data.reports || []
      
      // Deduplicate reports by dataset_id to prevent React key errors
      const uniqueReports = reports.reduce((acc: any[], report: any) => {
        const exists = acc.some(r => r.dataset_id === report.dataset_id)
        if (!exists) {
          acc.push(report)
        }
        return acc
      }, [])
      
      console.log('📊 Fetched reports for client:', uniqueReports)
      return uniqueReports
    } catch (error) {
      console.error("Error fetching client reports:", error)
      // Return empty array if API fails
      return []
    } finally {
      setLoadingReports(false)
    }
  }

  // Fetch v0 reports for a specific client
  const fetchClientV0Reports = async (clientId: string, forceRefresh = false) => {
    try {
      setLoadingV0Reports(true)
      const url = forceRefresh
        ? `/api/clients/${clientId}/v0-reports?refresh=${Date.now()}`
        : `/api/clients/${clientId}/v0-reports`
      
      const v0Response = await fetch(url, {
        cache: forceRefresh ? 'no-store' : 'default',
      })
      
      if (v0Response.ok) {
        const v0Data = await v0Response.json()
        setV0Reports(v0Data.reports || [])
        console.log('🔄 Fetched v0 reports for client:', v0Data.reports)
      } else {
        setV0Reports([])
      }
    } catch (error) {
      console.error("Error fetching v0 reports for client:", error)
      setV0Reports([])
    } finally {
      setLoadingV0Reports(false)
    }
  }

  const handleClientSelect = async (clientId: string) => {
    setSelectedClientId(clientId)
    // Find the full client object from the database clients
    const client = clients.find((c) => c.id?.toString() === clientId || c.name === clientId)
    setSelectedClient(client)
    
    // Debug logging
    console.log('Selected client ID:', clientId)
    console.log('Found client:', client)
    
    // Map database client data to frontend structure
    if (client) {
      // Fetch real reports for this client (PowerBI reports)
      const reports = await fetchClientReports(client.id)
      
      // Fetch v0 reports for this client
      await fetchClientV0Reports(client.id)
      
      // Create client data structure using database values (no defaults for null values)
      setClientData({
        name: client.name,
        db_name: client.db_name,
        ga_name: client.name,
        docker_version: client.docker_version || "",
        cron: { 
          expression: client.cron_expression || "", 
          timezone: client.cron_timezone || "" 
        },
        reports: reports, // Use real reports from database
        toggles: [
          ...(client.toggle_part_events ? ["part_events"] : []),
          ...(client.toggle_performance_loss ? ["performance_loss"] : []),
          ...(client.toggle_custom ? ["custom"] : [])
        ],
        customToggleValue: client.toggle_custom ? 
          (typeof client.toggle_custom === 'string' ? 
            client.toggle_custom : 
            JSON.stringify(client.toggle_custom)) : "",
      })
      
      console.log('🔄 Mapped client data with real reports:', {
        docker_version: client.docker_version,
        cron_expression: client.cron_expression,
        cron_timezone: client.cron_timezone,
        reports_count: reports.length,
        toggles: {
          part_events: client.toggle_part_events,
          performance_loss: client.toggle_performance_loss,
          custom: client.toggle_custom
        }
      })
    } else {
      setClientData(null)
      setV0Reports([])
    }
    setShowAddReport(false)
  }

  const handleSave = async () => {
    console.log('🔧 Save button clicked!')
    console.log('📋 Selected client:', selectedClient)
    console.log('📊 Client data:', clientData)
    
    if (!selectedClient || !clientData) {
      console.log('❌ Missing client or client data')
      showToast('Please select a client first.', 'error')
      return
    }

    setSavingConfig(true)
    
    try {
      // Prepare configuration data to send to the API
      const configData = {
        docker_version: clientData.docker_version,
        cron_expression: clientData.cron?.expression,
        cron_timezone: clientData.cron?.timezone,
        toggles: clientData.toggles || [],
        customToggleValue: clientData.customToggleValue || ""
      }

      console.log('💾 Saving configuration for client ID:', selectedClient.id)
      console.log('📦 Configuration data to send:', configData)

      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save configuration.')
      }

      const result = await response.json()
      showToast(`Configuration saved successfully for ${selectedClient.name}!`, 'success')
      console.log('Save result:', result)
      
    } catch (error) {
      console.error('Error saving configuration:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while saving the configuration.'
      showToast(`Error saving configuration: ${errorMessage}`, 'error')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleAddReport = async () => {
    if (newReport.name && newReport.group_id && newReport.dataset_id) {
      // Validate report name - only alphanumeric, underscores, and hyphens (no spaces)
      const nameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!nameRegex.test(newReport.name)) {
        showToast("Report name must contain only letters, numbers, underscores, and hyphens (no spaces).", "error");
        return;
      }

      const reportData = {
        name: newReport.name,
        group_id: newReport.group_id,
        dataset_id: newReport.dataset_id,
        type: "powerbi",
        client_id: selectedClient?.id || selectedClient?.client_id || null,
      }

      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reportData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to add report to BigQuery.")
        }

        // On successful API call, refresh the reports list from database
        const updatedReports = await fetchClientReports(selectedClient.id)
        setClientData({
          ...clientData,
          reports: updatedReports,
        })

        setNewReport({ name: "", group_id: "", dataset_id: "" })
        setShowAddReport(false)
        showToast("Report added successfully!", "success")
      } catch (error) {
        console.error("Error adding report:", error)
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while adding the report."
        showToast(`Error adding report: ${errorMessage}`, "error")
      }
    }
  }

  const handleRemoveReport = async (dataset_id: string) => {
    if (!selectedClient || !clientData.reports) {
      showToast('Unable to delete report: missing client or report data.', 'error')
      return
    }

    const reportToDelete = clientData.reports.find((r: any) => r.dataset_id === dataset_id)
    if (!reportToDelete) {
      showToast('Report not found.', 'error')
      return
    }

    // Optimistically update UI immediately - filter by dataset_id, not index
    setClientData((prevData: any) => ({
      ...prevData,
      reports: prevData.reports.filter((r: any) => r.dataset_id !== dataset_id),
    }))

    // Show immediate feedback
    showToast('Deleting report...', 'info')
    
    // Fire DELETE request in background
    try {
      const params = new URLSearchParams({ dataset_id })

      const response = await fetch(`/api/reports?${params}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // If report doesn't exist (404), treat as success - it's already deleted
        if (response.status === 404) {
          showToast('Report already deleted.', 'success')
          // Refresh reports from database to ensure sync
          const freshReports = await fetchClientReports(selectedClient.id)
          setClientData((prevData: any) => ({
            ...prevData,
            reports: freshReports,
          }))
          return
        }
        
        throw new Error(errorData.error || 'Failed to delete report from database.')
      }

      // Success notification - refresh from database to ensure sync
      showToast('Report deleted successfully!', 'success')
      
      // Refresh reports from database to stay in sync
      const freshReports = await fetchClientReports(selectedClient.id)
      setClientData((prevData: any) => ({
        ...prevData,
        reports: freshReports,
      }))
      
    } catch (error) {
      console.error('Error deleting report:', error)
      
      // Rollback: Add the report back if deletion failed (but check it's not already there)
      setClientData((prevData: any) => {
        // Check if report already exists to prevent duplicates
        const exists = prevData.reports.some((r: any) => r.dataset_id === dataset_id)
        if (exists) {
          return prevData // Don't add duplicate
        }
        return {
          ...prevData,
          reports: [...prevData.reports, reportToDelete],
        }
      })
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      showToast(`Failed to delete report: ${errorMessage}`, 'error')
    }
  }

  const handleToggleChange = (toggleValue: string, checked: boolean) => {
    const currentToggles = clientData.toggles || []
    let updatedToggles

    if (checked) {
      updatedToggles = [...currentToggles, toggleValue]
    } else {
      updatedToggles = currentToggles.filter((toggle: string) => toggle !== toggleValue)
    }

    setClientData({
      ...clientData,
      toggles: updatedToggles,
    })
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await response.json();
      
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  // V0 Reports handlers
  const handleViewHomemadeReport = (reportId: string) => {
    const report = v0Reports.find(r => r.report_id === reportId);
    if (report && report.is_active && report.uuid) {
      setSelectedReport({
        reportId: report.report_id,
        clientId: selectedClient?.id || selectedClientId,
        uuid: report.uuid,
        reportName: report.report_name,
        clientName: selectedClient?.name || clientData?.name || "",
        subdomain: report.sub_domain,
      });
      setActiveView("report-viewer");
    } else {
      showToast('Ce rapport n\'est pas encore configuré ou n\'est pas actif', 'error');
    }
  };

  const handleOpenHomemadeReportsConfig = () => {
    // Reset temp UUIDs when opening modal
    setTempUuids({});
    setShowHomemadeReportsConfig(true);
  };

  const handleAssignHomemadeReportUuid = async (reportId: string, uuid: string) => {
    if (!selectedClient) {
      showToast('Aucun client sélectionné', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}/v0-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          uuid: uuid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign UUID');
      }

      // Refresh v0 reports for this client (force refresh to get latest data)
      await fetchClientV0Reports(selectedClient.id, true);

      showToast('UUID assigné avec succès', 'success');
    } catch (error) {
      console.error('Error assigning UUID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite';
      showToast(`Erreur: ${errorMessage}`, 'error');
    }
  };

  const handleRemoveHomemadeReportUuid = (reportId: string) => {
    // This function is no longer used since we removed the delete button
    showToast('Configuration supprimée', 'success');
  };

  const generateRandomUuid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Render report viewer if active
  if (activeView === "report-viewer" && selectedReport) {
    return (
      <ReportViewer
        reportData={selectedReport}
        onBack={() => setActiveView("dashboard")}
      />
    );
  }

  // Render dashboard
  // Refresh all data
  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        fetchClients(true),
        fetchAvailableReports(true),
        selectedClient?.id ? fetchClientV0Reports(selectedClient.id, true) : Promise.resolve()
      ])
      showToast('Données actualisées avec succès', 'success')
    } catch (error) {
      console.error('Error refreshing data:', error)
      showToast('Erreur lors de l\'actualisation des données', 'error')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">App CS Airflow - Customer Success</h1>
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefreshAll} />
          <Link href="/rapports-v0">
            <Button variant="outline">
              Rapports v0
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Client Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={handleClientSelect} disabled={loadingClients}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id || client.name} value={client.id?.toString() || client.name}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {clientData && (
        <>
          {/* Airflow Configurations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Airflow Configurations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Database Name</Label>
                <p className="text-sm font-medium text-foreground px-3 py-2 bg-muted rounded-md">
                  {clientData.db_name || "Not specified"}
                </p>
              </div>

              <div>
                <Label htmlFor="docker-version">Docker Version</Label>
                <Input
                  id="docker-version"
                  value={clientData.docker_version}
                  onChange={(e) => setClientData({ ...clientData, docker_version: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cron-expression">Cron Expression</Label>
                <Input
                  id="cron-expression"
                  value={clientData.cron.expression}
                  onChange={(e) =>
                    setClientData({
                      ...clientData,
                      cron: { ...clientData.cron, expression: e.target.value },
                    })
                  }
                />
                {clientData.cron.expression && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        try {
                          return cronstrue.toString(clientData.cron.expression, {
                            use24HourTimeFormat: true,
                          });
                        } catch (error) {
                          return "Invalid cron expression";
                        }
                      })()}
                    </p>
                  </div>
                )}
                <a 
                  href="https://crontab.guru/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 underline mt-1 inline-block"
                >
                  Cron Maker
                </a>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={clientData.cron.timezone}
                  onValueChange={(value) =>
                    setClientData({
                      ...clientData,
                      cron: { ...clientData.cron, timezone: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Feature Toggles</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {availableToggles.filter(toggle => toggle.value !== 'custom').map((toggle) => (
                    <div key={toggle.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={toggle.value}
                        checked={clientData.toggles?.includes(toggle.value) || false}
                        onChange={(e) => handleToggleChange(toggle.value, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={toggle.value} className="text-sm font-normal">
                        {toggle.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="custom-toggle">Custom Configuration (JSON)</Label>
                  <Input
                    id="custom-toggle"
                    placeholder="Enter custom configuration..."
                    value={clientData.customToggleValue || ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      
                      // Update the value immediately for typing experience
                      setClientData({ 
                        ...clientData, 
                        customToggleValue: inputValue,
                        toggles: inputValue 
                          ? [...(clientData.toggles?.filter((t: string) => t !== 'custom') || []), 'custom']
                          : clientData.toggles?.filter((t: string) => t !== 'custom') || []
                      });
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value.trim();
                      
                      // Validate JSON when user finishes editing (onBlur)
                      if (inputValue) {
                        try {
                          JSON.parse(inputValue);
                          // Valid JSON - no action needed, already saved in onChange
                        } catch {
                          showToast("Invalid JSON format. Please check your syntax.", "error");
                          // Keep the invalid value so user can fix it
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter valid JSON format. Will be validated when you finish editing.
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} className="mt-4" disabled={savingConfig}>
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>

          {/* Power BI Reports */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Power BI Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading reports...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Dataset ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientData.reports && clientData.reports.length > 0 ? (
                      clientData.reports.map((report: any) => (
                        <TableRow key={report.dataset_id}>
                          <TableCell>{report.name}</TableCell>
                          <TableCell className="font-mono text-sm">{report.group_id}</TableCell>
                          <TableCell className="font-mono text-sm">{report.dataset_id}</TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveReport(report.dataset_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No reports found for this client
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {!showAddReport && (
                <Button onClick={() => setShowAddReport(true)} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Report
                </Button>
              )}

              {showAddReport && (
                <div className="mt-4 p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Add New Report</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Input
                        placeholder="Report Name"
                        value={newReport.name}
                        onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1"></p>
                    </div>
                    <Input
                      placeholder="Group ID"
                      value={newReport.group_id}
                      onChange={(e) => setNewReport({ ...newReport, group_id: e.target.value })}
                    />
                    <Input
                      placeholder="Dataset ID"
                      value={newReport.dataset_id}
                      onChange={(e) => setNewReport({ ...newReport, dataset_id: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddReport}>Add Report</Button>
                    <Button variant="outline" onClick={() => setShowAddReport(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Homemade Reports */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rapports v0 - {selectedClient?.name || clientData.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {v0Reports.filter(r => r.is_active).length} / {v0Reports.length} actifs
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Rapports personnalisés pour ce client. Chaque client a accès aux mêmes modèles de rapports avec ses propres données.
              </p>
              
              {loadingV0Reports ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Chargement des rapports...</p>
                </div>
              ) : v0Reports.length > 0 ? (
                <div className="space-y-3">
                  {v0Reports.map((report) => {
                    const fullUrl = report.uuid ? `https://${report.sub_domain}.report.intelligenceindustrielle.com/report/${report.uuid}` : '';
                    
                    return (
                      <div
                        key={report.report_id}
                        className={`p-4 rounded-md border ${
                          report.is_active ? 'bg-primary/5 border-primary/20' : 'bg-muted'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {report.is_active ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium">{report.report_name}</div>
                                {report.uuid && (
                                  <div className="text-xs text-muted-foreground font-mono mt-1">
                                    UUID: {report.uuid}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(fullUrl, '_blank')}
                              disabled={!report.uuid}
                            >
                              <ArrowUpRight className="h-3 w-3 mr-0" />
                              Voir le rapport
                            </Button>
                          </div>
                          {fullUrl && (
                            <div className="text-xs text-muted-foreground bg-background p-2 rounded border break-all font-mono">
                              {fullUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun rapport disponible pour ce client</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenHomemadeReportsConfig}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer les rapports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Information */}
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Last DAG Run</h4>
                  <p className="text-2xl font-bold">2 hours ago</p>
                  <p className="text-sm text-muted-foreground">Status: Success</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Average Runtime</h4>
                  <p className="text-2xl font-bold">12.5 min</p>
                  <p className="text-sm text-muted-foreground">Last 10 runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Homemade Reports Configuration Modal */}
      {showHomemadeReportsConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuration - {selectedClient?.name || clientData?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configurez les UUID pour chaque rapport de ce client. Chaque UUID doit être unique et correspondre à la configuration côté rapport.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHomemadeReportsConfig(false)}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Configured Reports Section */}
              {v0Reports.filter(r => r.uuid).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rapports configurés</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {v0Reports.filter(r => r.uuid).map((report) => {
                      const fullUrl = `https://${report.sub_domain}.report.intelligenceindustrielle.com/report/${report.uuid}`;
                      
                      return (
                        <div key={report.report_id} className="p-4 bg-primary/5 rounded-md border border-primary/20">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <div className="text-sm font-medium">{report.report_name}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(fullUrl, "_blank")}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Ouvrir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(fullUrl);
                                    showToast('URL copiée dans le presse-papiers', 'success');
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copier
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border break-all">
                              {fullUrl}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Add/Configure Reports Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {v0Reports.filter(r => r.uuid).length > 0 ? 'Configurer d\'autres rapports' : 'Configurer les rapports'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableReports.map((availableReport) => {
                    // Find if this client already has a UUID for this report
                    const clientReport = v0Reports.find(r => r.report_name === availableReport.name);
                    const hasUuid = clientReport && clientReport.uuid;
                    const tempUuid = tempUuids[availableReport.name] || "";
                    
                    const baseUrl = `https://${availableReport.sub_domain}.report.intelligenceindustrielle.com`;
                    
                    // Only show UUID input for reports without a UUID
                    if (hasUuid) {
                      return (
                        <div
                          key={availableReport.id}
                          className="p-4 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{availableReport.name}</div>
                              <div className="text-xs text-muted-foreground font-mono mt-1">
                                UUID: {clientReport.uuid}
                              </div>
                            </div>
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Configuré
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={availableReport.id}
                        className="p-4 rounded-md bg-muted"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{availableReport.name}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground bg-background p-2 rounded border break-all">
                            {baseUrl}/report/<span className="text-primary">[UUID]</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              placeholder="UUID du rapport"
                              value={tempUuid}
                              onChange={(e) => setTempUuids({ ...tempUuids, [availableReport.name]: e.target.value })}
                              className="font-mono flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTempUuids({ ...tempUuids, [availableReport.name]: generateRandomUuid() })}
                            >
                              Générer
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (tempUuid.trim()) {
                                  handleAssignHomemadeReportUuid(availableReport.id, tempUuid.trim());
                                  setTempUuids({ ...tempUuids, [availableReport.name]: "" });
                                }
                              }}
                              disabled={!tempUuid.trim()}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Assigner
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="sticky bottom-0 bg-background border-t p-6 flex justify-end">
              <Button onClick={() => setShowHomemadeReportsConfig(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
