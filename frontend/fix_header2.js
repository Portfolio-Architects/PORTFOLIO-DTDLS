const fs = require('fs');

let dashboard = fs.readFileSync('src/components/DashboardClient.tsx', 'utf-8');

if (!dashboard.includes('const [isScrolled, setIsScrolled] = useState(false);')) {
  dashboard = dashboard.replace(
    /const \[listSort, setListSort\]/g,
    `const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [listSort, setListSort]`
  );

  fs.writeFileSync('src/components/DashboardClient.tsx', dashboard);
  console.log('Fixed Reference Error successfully!');
} else {
  console.log('Already fixed!');
}
