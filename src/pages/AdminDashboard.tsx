import { Outlet } from 'react-router-dom'
import Layout from '../components/Layout'

export default function AdminDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
