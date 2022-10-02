module.exports = function(req, res, next){
    if(req.session && req.session.sessionid){
        next();
    }
    else {
        //req.session.user = [{name: "Arun", ppc: 13987, role: "admin"}]
        //next();
        res.status(401).send('Invalid session.');
    } 
}