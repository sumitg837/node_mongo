let app = require('./server');
let login = require('./app/controllers/login');
let dashboard = require('./app/controllers/dashboard');
let api = require('./app/controllers/api');

app.get('/', login.index);
app.post('/', login.authenticateLogin);
app.get('/logout', login.logout);
app.get('/error', login.error);

app.get('/dashboard', dashboard.index);
app.get('/drivers', dashboard.drivers);
app.get('/advertisement', dashboard.advertisement);
app.get('/drivers/:id/remove', dashboard.removeDriver);
app.get('/advertisements/:id/remove', dashboard.removeAd);
app.get('/contact', dashboard.contact);
app.get('/view-notification/:id/view', dashboard.viewNotification);
app.get('/contact/:id/remove', dashboard.removeContact);
app.get('/subscriber', dashboard.subscriber);
app.get('/ad-engage', dashboard.adEngage);
app.get('/revenue', dashboard.revenue);
app.get('/test', dashboard.test);
app.get('/download-file/:name/download', dashboard.downloadFile);

app.post('/add-advertisement', dashboard.addAdvertisement);
app.post('/add-driver', dashboard.addDriver);
// app.post('/check-tablet', dashboard.checkTablet);
app.post('/edit-driver', dashboard.editDriver);
app.post('/update-driver', dashboard.updateDriver);
app.post('/edit-advertisement', dashboard.editAdvertisement);
app.post('/update-advertisement', dashboard.updateAdvertisement);
app.post('/ad-count', dashboard.adCount);
app.post('/fetch-revenue', dashboard.fetchRevenue);
app.post('/download-csv', dashboard.downloadCsv)



/**Api routing **/
app.post('/api/v1/contacts', api.contact);
app.post('/api/v1/imeis', api.imeis);
app.post('/api/v1/subscribers', api.subScribers);
app.post('/api/v1/bulk-subscribers', api.bulkSubscribers);
// app.put('/api/v1/ad-clicks', api.adClick);
app.post('/api/v1/play-times', api.playTime);
app.post('/api/v1/test', api.test);

//http://admin.adtentio.co.uk
