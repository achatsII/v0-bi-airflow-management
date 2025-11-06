"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { RefreshButton } from "@/components/refresh-button"

interface V0Report {
  report_id: string
  report_name: string
  client_name: string
  sub_domain: string
  uuid: string
  is_active: boolean
}

export default function RapportsV0Page() {
  const [availableReports, setAvailableReports] = useState<{ id: string, name: string, sub_domain: string }[]>([])
  const [clientReportsData, setClientReportsData] = useState<V0Report[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch available reports from Reports table and client-report mappings
  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Fetch available reports from Reports table
      const reportsUrl = forceRefresh
        ? `/api/v0-reports/available?refresh=${Date.now()}`
        : `/api/v0-reports/available`
      
      const reportsResponse = await fetch(reportsUrl, {
        cache: forceRefresh ? 'no-store' : 'default',
      })
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setAvailableReports(reportsData.reports || [])
      }
      
      // Fetch client-report mappings from app_client_reports view
      const clientReportsUrl = forceRefresh
        ? `/api/v0-reports?refresh=${Date.now()}`
        : `/api/v0-reports`
      
      const clientReportsResponse = await fetch(clientReportsUrl, {
        cache: forceRefresh ? 'no-store' : 'default',
      })
      
      if (clientReportsResponse.ok) {
        const clientReportsData = await clientReportsResponse.json()
        setClientReportsData(clientReportsData.reports || [])
      }
    } catch (error) {
      console.error("Error fetching v0 reports:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // For each report, find which clients have it configured and active
  const getClientsWithReport = (reportName: string) => {
    return clientReportsData
      .filter(r => r.report_name === reportName && r.is_active === true)
      .map(r => ({ name: r.client_name }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Rapports v0</h1>
            </div>
            <RefreshButton onRefresh={async () => await fetchData(true)} />
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">Chargement des rapports...</p>
            </div>
          ) : availableReports.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">Aucun rapport disponible</p>
            </div>
          ) : (
            availableReports.map((report) => {
              const clientsWithReport = getClientsWithReport(report.name)
              const hasActiveClients = clientsWithReport.length > 0

              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasActiveClients ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasActiveClients ? (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Clients actifs ({clientsWithReport.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {clientsWithReport.map((client, index) => (
                            <span
                              key={`${client.name}-${index}`}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {client.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun client n'a ce rapport configuré actuellement.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

