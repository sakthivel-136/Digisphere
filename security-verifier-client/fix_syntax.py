with open('app/dashboard/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("            </motion.div>\\n          </>\\n        ) : report.length === 0 && !loading ? (", "          </>\\n        ) : report.length === 0 && !loading ? (")

with open('app/dashboard/page.tsx', 'w') as f:
    f.write(content)
