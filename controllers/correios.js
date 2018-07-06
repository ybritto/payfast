module.exports = function(app){

  app.post("/correios/calculo-prazo", function(req, res){

    console.log("Aaaaaaaa");

    var dadosDaEntrega = req.body;

    var correiosSOAPClient = new app.servicos.clienteCorreios();

    correiosSOAPClient.calculaPrazo(dadosDaEntrega, function(erro, resultado){
      if (erro){
        res.status(500).send(erro);
        return;
      }

      console.log(resultado);
      res.json(resultado);

    })

  })

}
