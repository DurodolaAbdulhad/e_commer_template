export default function PageBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#fff',
      minHeight: '70vh',
    }}>
      {children}
    </div>
  )
}
