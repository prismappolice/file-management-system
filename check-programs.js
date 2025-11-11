const { Pool } = require('pg')

const pool = new Pool({
  user: 'fms_user',
  host: 'localhost',
  database: 'file_management',
  password: 'fms_password_2024',
  port: 5432,
})

async function checkPrograms() {
  try {
    const result = await pool.query('SELECT id, name, path FROM programs ORDER BY id')
    console.log('\n=== ALL PROGRAMS IN DATABASE ===')
    console.log('Total programs:', result.rows.length)
    console.log('\nProgram details:')
    result.rows.forEach(program => {
      console.log(`- ID: ${program.id}`)
      console.log(`  Name: ${program.name}`)
      console.log(`  Path: ${program.path}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

checkPrograms()
