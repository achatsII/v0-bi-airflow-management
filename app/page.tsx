"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import cronstrue from "cronstrue"
import parser from "cron-parser"

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
    toggles: ["new_part_events"],
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
  { value: "new_part_events", label: "New Part Events" },
  { value: "part_events", label: "Part Events" },
  { value: "performance_loss", label: "Performance Loss" },
  { value: "custom", label: "Custom" },
]

export default function AirflowManagement() {
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [clientData, setClientData] = useState<any>(null)
  const [newReport, setNewReport] = useState({ name: "", group_id: "", dataset_id: "" })
  const [showAddReport, setShowAddReport] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)

  // Fetch clients from database on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true)
        const response = await fetch("/api/clients")
        
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

    fetchClients()
  }, [])

  // Function to fetch reports for a specific client
  const fetchClientReports = async (clientId: string) => {
    try {
      setLoadingReports(true)
      const response = await fetch(`/api/clients/${clientId}/reports`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch client reports")
      }
      
      const data = await response.json()
      console.log('📊 Fetched reports for client:', data.reports)
      return data.reports || []
    } catch (error) {
      console.error("Error fetching client reports:", error)
      // Return empty array if API fails
      return []
    } finally {
      setLoadingReports(false)
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
      // Fetch real reports for this client
      const reports = await fetchClientReports(client.id)
      
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
          ...(client.toggle_new_part_events ? ["new_part_events"] : []),
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
          new_part_events: client.toggle_new_part_events,
          performance_loss: client.toggle_performance_loss,
          custom: client.toggle_custom
        }
      })
    } else {
      setClientData(null)
    }
    setShowAddReport(false)
  }

  const handleSave = async () => {
    console.log('🔧 Save button clicked!')
    console.log('📋 Selected client:', selectedClient)
    console.log('📊 Client data:', clientData)
    
    if (!selectedClient || !clientData) {
      console.log('❌ Missing client or client data')
      alert('Please select a client first.')
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
      alert(`✅ Configuration saved successfully for ${selectedClient.name}!`)
      console.log('Save result:', result)
      
    } catch (error) {
      console.error('Error saving configuration:', error)
      if (error instanceof Error) {
        alert(`❌ Error saving configuration: ${error.message}`)
      } else {
        alert('❌ An unknown error occurred while saving the configuration.')
      }
    } finally {
      setSavingConfig(false)
    }
  }

  const handleAddReport = async () => {
    if (newReport.name && newReport.group_id && newReport.dataset_id) {
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
        alert("Report added successfully!")
      } catch (error) {
        console.error("Error adding report:", error)
        if (error instanceof Error) {
          alert(`Error adding report: ${error.message}`)
        } else {
          alert("An unknown error occurred while adding the report.")
        }
      }
    }
  }

  const handleRemoveReport = async (index: number) => {
    if (!selectedClient || !clientData.reports[index]) {
      alert('Unable to delete report: missing client or report data.')
      return
    }

    const reportToDelete = clientData.reports[index]
    
    try {
      // Build query parameters for the DELETE request (only dataset_id needed as primary key)
      const params = new URLSearchParams({
        dataset_id: reportToDelete.dataset_id
      })

      const response = await fetch(`/api/reports?${params}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete report from database.')
      }

      // On successful API call, refresh the reports list from database
      const updatedReports = await fetchClientReports(selectedClient.id)
      setClientData({
        ...clientData,
        reports: updatedReports,
      })

      alert("Report deleted successfully!")
      
    } catch (error) {
      console.error('Error deleting report:', error)
      if (error instanceof Error) {
        alert(`❌ Error deleting report: ${error.message}`)
      } else {
        alert('❌ An unknown error occurred while deleting the report.')
      }
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">App CS Airflow - Customer Success</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
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
                          alert("Invalid JSON format. Please check your syntax.");
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
                      clientData.reports.map((report: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{report.name}</TableCell>
                          <TableCell className="font-mono text-sm">{report.group_id}</TableCell>
                          <TableCell className="font-mono text-sm">{report.dataset_id}</TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveReport(index)}>
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
                    <Input
                      placeholder="Report Name"
                      value={newReport.name}
                      onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    />
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
    </div>
  )
}
