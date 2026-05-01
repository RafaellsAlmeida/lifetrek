-- Accent the three public answer-page blog posts shown on the website.

UPDATE public.blog_posts
SET
  title = 'Como qualificar um fornecedor de manufatura médica sob ISO 13485',
  content = $$<p>Para qualificar um fornecedor de manufatura médica sob ISO 13485, o OEM deve verificar mais do que certificação. O processo precisa confirmar responsabilidades de qualidade, controle de revisão de desenhos, rastreabilidade de lote, evidência de inspeção, regras de mudança, capacidade produtiva e resposta a não conformidades antes da liberação de produção.</p>
<h2>Por que isso importa</h2>
<p>A certificação indica que existe um sistema de gestão da qualidade, mas não substitui evidência operacional. Muitos riscos aparecem tarde: desenho desatualizado, mudança de processo sem avaliação, FAI incompleto, CAPA lenta, lote sem genealogia fechada ou embalagem e manuseio sem controle suficiente.</p>
<h2>O que perguntar ao fornecedor</h2>
<ul>
<li>Existe acordo de qualidade ou matriz de responsabilidades antes da produção?</li>
<li>Como desenhos e revisões são liberados para produção?</li>
<li>Como mudanças de site, subfornecedor, processo crítico ou programa são avaliadas?</li>
<li>O que entra no pacote de FAI ou primeiro lote controlado?</li>
<li>Quais documentos acompanham a liberação de lote?</li>
<li>Como desvios e lotes suspeitos são avaliados e documentados, quando aplicável?</li>
<li>Qual é o fluxo de contenção, causa raiz e ação corretiva?</li>
</ul>
<h2>Evidências para pedir</h2>
<ul>
<li>Certificação e escopo ISO 13485.</li>
<li>Modelo de acordo de qualidade ou matriz de responsabilidades.</li>
<li>Exemplo anonimizado de controle de revisão de desenho.</li>
<li>Exemplo de FAI ou sumário dimensional.</li>
<li>Certificado de material, CoC e sumário de inspeção.</li>
<li>Fluxo de controle de mudanças.</li>
<li>Evidência de tratamento de desvios e disposição, quando aplicável.</li>
</ul>
<h2>Como a Lifetrek trata esse tema</h2>
<p>A Lifetrek opera com sistema de qualidade ISO 13485 para manufatura médica. Antes de seguir para produção ou liberação, o produto passa por análise e aprovação de Produção e Qualidade, conforme o escopo aprovado. A Lifetrek trabalha com desenhos controlados na revisão vigente dentro do sistema de qualidade ISO 13485.</p>
<p>Evidências aplicáveis ao escopo do serviço podem ser discutidas sob solicitação, incluindo desenho, processo, qualidade e entrega. A contenção é tratada com prioridade e ações corretivas seguem procedimentos internos definidos no sistema de qualidade.</p>
<h2>O que ainda deve ser validado caso a caso</h2>
<p>Acordo de qualidade assinado, direitos de auditoria, IQ/OQ/PQ, validações de limpeza, marcação ou embalagem e janelas formais de resposta CAPA não devem ser tratados como promessa universal. Esses pontos dependem de escopo, contrato, requisito do cliente e aprovação interna.</p>
<h2>Perguntas frequentes</h2>
<h3>ISO 13485 garante que o fornecedor está pronto?</h3>
<p>Não sozinho. ISO 13485 indica que existe um sistema de gestão da qualidade, mas o OEM ainda precisa verificar escopo, processo real, documentação de lote, controle de mudanças, capacidade produtiva e resposta a desvios.</p>
<h3>O que deve estar em um acordo de qualidade?</h3>
<p>Um acordo de qualidade deve definir responsabilidades, critérios de liberação, auditoria, notificação de mudanças, tratamento de não conformidades, rastreabilidade, documentação exigida e regras de comunicação entre OEM e fornecedor.</p>
<h3>Quando pedir FAI?</h3>
<p>FAI é mais útil em transferência, primeiro lote, revisão crítica de desenho, mudança de processo ou quando uma característica dimensional impacta montagem, função, rastreabilidade ou risco regulatório.</p>
<h3>O que indica risco em um fornecedor?</h3>
<p>Sinais de risco incluem promessa de prazo sem plano de transferência, respostas vagas sobre rastreabilidade, falta de controle de revisão, resistência à auditoria, mudanças não notificadas e ausência de regras claras para avaliar lote suspeito.</p>
<h3>Como reduzir risco sem exigir garantia impossível?</h3>
<p>O caminho mais defensável é exigir visibilidade e disciplina: primeiro lote controlado quando aplicável, FAI, rastreabilidade, controle de mudanças, critério de aceitação, contenção documentada e revisão de capacidade antes da escala.</p>
<h2>Próximo passo</h2>
<p>Use o checklist de auditoria de fornecedores para transformar a conversa de qualificação em uma revisão objetiva de evidência.</p>$$,
  excerpt = 'Veja quais evidências pedir antes de aprovar um fornecedor de manufatura médica: acordo de qualidade, rastreabilidade, FAI, validação e controle de mudanças.',
  seo_title = 'Como qualificar fornecedor médico ISO 13485 | Lifetrek',
  seo_description = 'Veja evidências para qualificar fornecedor de manufatura médica: ISO 13485, desenho controlado, FAI, rastreabilidade, CAPA e mudanças.',
  keywords = ARRAY['qualificação de fornecedor ISO 13485','fornecedor de dispositivos médicos','manufatura médica','rastreabilidade','controle de mudanças'],
  metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'pillar_keyword', 'qualificação de fornecedor ISO 13485',
      'entity_keywords', jsonb_build_array('Lifetrek Medical', 'ISO 13485', 'ANVISA', 'fornecedor de dispositivos médicos', 'manufatura médica', 'rastreabilidade', 'controle de mudanças', 'Indaiatuba'),
      'locale', 'pt-BR',
      'accented_at', '2026-04-28'
    ),
  updated_at = timezone('utc'::text, now())
WHERE slug = 'como-qualificar-fornecedor-manufatura-medica-iso-13485';

UPDATE public.blog_posts
SET
  title = 'O que um primeiro lote controlado precisa provar antes da escala',
  content = $$<p>Um primeiro lote controlado deve provar que o processo consegue produzir a peça certa, na revisão certa, com medições aceitáveis, documentação rastreável, fluxo de liberação claro e capacidade inicial realista. Quando um lote piloto for aplicável, ele também deve revelar gargalos, desvios e ajustes necessários antes de transferir uma família inteira para escala.</p>
<h2>Por que isso importa</h2>
<p>Transferências falham quando a organização pula do desenho para a produção como se capacidade, inspeção, documentação e suprimentos já estivessem resolvidos. O primeiro lote controlado cria uma etapa de aprendizado antes que o risco vire atraso, retrabalho ou disputa de qualidade.</p>
<h2>O que o primeiro lote deve provar</h2>
<ul>
<li>A revisão correta do desenho chegou ao chão de fábrica.</li>
<li>Características críticas foram medidas e registradas.</li>
<li>Desvios foram documentados e tiveram disposição.</li>
<li>Materiais, fornecedores e certificados estão rastreáveis.</li>
<li>O fluxo de inspeção e liberação funciona.</li>
<li>Gargalos de máquina, setup, inspeção ou acabamento foram mapeados.</li>
<li>A escala proposta é coerente com capacidade real.</li>
</ul>
<h2>O que revisar antes de produzir</h2>
<p>Antes da produção, a Lifetrek avalia capacidade e recursos críticos, incluindo ferramentas, disponibilidade, dispositivos, FMEA, mão de obra e recursos de medição. Para projetos make-to-order, a linguagem mais precisa é transferência de item, peça, projeto ou família de peças; SKU não deve ser tratado como unidade padrão.</p>
<h2>Falhas comuns</h2>
<ul>
<li>Primeiro lote aprovado sem FAI ou sumário dimensional suficiente.</li>
<li>Mudanças de programa ou setup tratadas como ajustes informais.</li>
<li>Desenho revisado sem aceite controlado.</li>
<li>Prazo prometido sem revisão de capacidade.</li>
<li>Família de peças escalada antes de avaliar o primeiro item ou projeto.</li>
</ul>
<h2>Como a Lifetrek trata esse tema</h2>
<p>A Lifetrek trabalha com desenhos controlados na revisão vigente dentro do sistema de qualidade ISO 13485. Antes de seguir para produção ou liberação, o produto passa por análise e aprovação de Produção e Qualidade, conforme o escopo aprovado.</p>
<p>O pacote de FAI ou liberação deve ser definido conforme desenho, requisito do cliente, processo aplicável e critérios aprovados. Evidências aplicáveis ao escopo do serviço podem ser discutidas sob solicitação.</p>
<h2>Perguntas frequentes</h2>
<h3>Primeiro lote controlado é a mesma coisa que validação?</h3>
<p>Não necessariamente. Um primeiro lote controlado ou lote piloto, quando aplicável, pode gerar evidência para transferência e aprendizado de processo, mas validação formal depende do risco, do processo, dos requisitos do produto e dos critérios definidos no sistema de qualidade.</p>
<h3>Quantas peças um primeiro lote controlado deve ter?</h3>
<p>Depende da geometria, risco, características críticas, histórico do processo e plano de aceitação. O ponto principal é justificar o tamanho da amostra e ligar a amostra ao risco técnico.</p>
<h3>O que deve sair do primeiro lote controlado?</h3>
<p>O mínimo prático é: revisão de desenho usada, registros dimensionais, desvios e disposição, certificados aplicáveis, rastreabilidade, observações de capacidade, gargalos e recomendação para escala ou novo ajuste.</p>
<h3>Quando não escalar depois do primeiro lote?</h3>
<p>Não escale se houver instabilidade dimensional, documentação incompleta, gargalo sem plano, revisão errada, desvios sem causa definida ou mudança de processo ainda não avaliada.</p>
<h2>Próximo passo</h2>
<p>Use o checklist de transferência NPI para produção para revisar desenho, critério de aceitação, FAI, rastreabilidade e capacidade antes de escalar.</p>$$,
  excerpt = 'Entenda como um primeiro lote controlado reduz risco de transferência em manufatura médica ao testar capacidade, FAI, controle dimensional e rastreabilidade.',
  featured_image = '/images/equipment/lab-overview.webp',
  seo_title = 'Primeiro lote controlado antes da escala | Lifetrek',
  seo_description = 'Entenda o que um primeiro lote controlado deve provar antes da escala: desenho vigente, FAI, rastreabilidade, capacidade e critérios de liberação.',
  keywords = ARRAY['primeiro lote controlado manufatura médica','lote piloto quando aplicável','NPI','transferência para produção','FAI','rastreabilidade'],
  metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'pillar_keyword', 'primeiro lote controlado manufatura médica',
      'entity_keywords', jsonb_build_array('primeiro lote controlado', 'lote piloto quando aplicável', 'NPI', 'transferência para produção', 'FAI', 'rastreabilidade', 'Lifetrek Medical'),
      'locale', 'pt-BR',
      'accented_at', '2026-04-28'
    ),
  updated_at = timezone('utc'::text, now())
WHERE slug = 'o-que-primeiro-lote-controlado-deve-provar-antes-da-escala';

UPDATE public.blog_posts
SET
  title = 'O que rastreabilidade de lote deve incluir em implantes e instrumentais',
  content = $$<p><strong>Rastreabilidade não é papelada. É o que decide se um desvio vira um susto contido em um lote ou um problema caro que trava produção, estoque e investigação.</strong></p>
<p>Em implantes ortopédicos, componentes odontológicos, soluções veterinárias e instrumentais cirúrgicos, não basta ter um número de lote numa etiqueta. Quando uma não conformidade aparece tarde, a pergunta verdadeira é: a genealogia do lote consegue apontar exatamente o que precisa ser contido, ou será necessário bloquear tudo por precaução?</p>
<p>Esse é o ponto que separa documentação útil de documentação decorativa. Um pacote de lote pode parecer completo no papel, mas ainda falhar quando material, desenho, processo, inspeção, identificação e liberação não contam a mesma história técnica.</p>
<h2>O problema não é só encontrar o lote</h2>
<p>Encontrar o lote é o começo. O que importa é saber o que aquele lote prova. Qual revisão do desenho foi usada? Qual material entrou? Quais características foram medidas? Houve desvio? Quem liberou? O produto foi enviado, segregado, retrabalhado ou reprovado?</p>
<p>Se essas respostas exigem caça ao dado em e-mail antigo, planilha paralela ou memória de operador, a rastreabilidade está frágil. Em uma auditoria, reclamação de cliente ou investigação de campo, essa fragilidade aparece como atraso, escopo de bloqueio maior e discussão técnica menos objetiva.</p>
<h2>Checklist clicável de genealogia do lote</h2>
<p>Use este checklist como revisão operacional antes de aceitar, liberar ou enviar um lote crítico. Ele não é burocracia extra: é o que ajuda a transformar uma contenção ampla em uma decisão proporcional ao risco.</p>
<ul>
<li><strong>Número de lote, ordem, serial ou identificador equivalente definido.</strong> Sem identificador único, não há genealogia; há tentativa de reconstrução depois do fato.</li>
<li><strong>Família, item, código interno e revisão vigente do desenho registrados.</strong> Uma peça correta fabricada com revisão errada ainda cria risco técnico, retrabalho e investigação.</li>
<li><strong>Matéria-prima vinculada ao certificado aplicável.</strong> O certificado precisa conversar com o lote real, não ficar solto como anexo sem vínculo operacional.</li>
<li><strong>Especificações críticas e critérios de aceitação conectados ao lote.</strong> Medir sem critério claro transforma inspeção em registro incompleto.</li>
<li><strong>Processo, etapa crítica, máquina, setup ou rota identificados quando aplicável.</strong> Quando algo muda no processo, a empresa precisa saber quais lotes podem ter sido afetados.</li>
<li><strong>Registros de inspeção ligados ao mesmo lote, serial ou ordem.</strong> O registro dimensional só ajuda se for possível provar a qual produto e revisão ele pertence.</li>
<li><strong>CoC ou documento de conformidade com referência consistente.</strong> O CoC deve fechar a história, não substituir material, desenho e inspeção.</li>
<li><strong>Marcação, etiqueta, serialização ou UDI verificados quando aplicável.</strong> A identificação física precisa bater com o pacote documental.</li>
<li><strong>Desvios, concessões, retrabalhos e disposições documentados quando existirem.</strong> O problema não é ter desvio; é não conseguir provar como ele foi avaliado.</li>
<li><strong>Responsável, data e critério de liberação registrados.</strong> Liberação sem critério explícito vira opinião retrospectiva.</li>
<li><strong>Destino do lote claro.</strong> Liberado, segregado, retrabalhado, reprovado ou sob avaliação: o status precisa ser inequívoco.</li>
</ul>
<h2>Falhas comuns que ampliam o problema</h2>
<p><strong>CoC sem ligação clara com material, inspeção e revisão.</strong> O lote foi liberado com um documento bonito, mas quando a dúvida apareceu ninguém conseguiu provar qual revisão sustentava aquela liberação. Resultado: investigação maior do que precisava.</p>
<p><strong>Identificação física que não fecha com os registros.</strong> A etiqueta aponta um lote, o registro dimensional aponta outro e o certificado de material não ajuda a resolver. Nesse cenário, a empresa perde tempo reconciliando dados antes mesmo de decidir o que fazer.</p>
<p><strong>Inspeção registrada sem característica crítica ou critério de aceitação.</strong> Existe evidência de que algo foi medido, mas não de que o que importava foi aceito. Para qualidade, isso é uma diferença enorme.</p>
<p><strong>Lote suspeito sem status documentado.</strong> Quando não está claro se o lote foi segregado, liberado, retrabalhado ou reprovado, a tendência é ampliar bloqueio e investigação por segurança.</p>
<h2>Como avaliar maturidade sem criar burocracia</h2>
<p>A melhor revisão não começa pedindo uma lista infinita de documentos. Começa pedindo um exemplo real ou anonimizado de pacote de lote: desenho usado, CoC, certificado de material, inspeção, identificação e eventuais desvios. Esse exemplo mostra mais maturidade operacional do que uma resposta genérica em auditoria.</p>
<p>Ao revisar, procure consistência. O mesmo lote aparece nos documentos certos? A revisão do desenho bate com o registro dimensional? O certificado de material está conectado ao item produzido? O status final está claro? Se houve desvio, existe disposição documentada?</p>
<p>Esse tipo de revisão evita dois extremos ruins: aceitar um pacote fraco só porque existe CoC ou criar uma burocracia pesada que não melhora a decisão técnica.</p>
<h2>O que muda para Qualidade, Operações e Supply Chain</h2>
<p>Para Qualidade, uma genealogia bem fechada reduz área cinzenta. Em vez de discutir se um documento “deve existir em algum lugar”, o time consegue avaliar evidência, escopo e disposição com mais objetividade.</p>
<p>Para Operações, rastreabilidade evita que um problema pequeno vire uma parada maior. Quando lote, rota, revisão, inspeção e destino estão claros, fica mais fácil separar o que está sob suspeita do que não tem relação com o evento.</p>
<p>Para Supply Chain, o ganho é previsibilidade. Um fornecedor que entrega documentação consistente ajuda o cliente a decidir mais rápido, responder melhor a auditorias e evitar bloqueios amplos por falta de evidência.</p>
<p>É por isso que o checklist não deve ser tratado como anexo administrativo. Ele é uma ferramenta de decisão: ajuda a equipe a saber se está olhando para um lote controlado ou para um conjunto de documentos que só parece completo.</p>
<h2>Perguntas frequentes</h2>
<h3>CoC basta para provar rastreabilidade?</h3>
<p>Não. O CoC é uma peça do pacote. Ele precisa se conectar a certificados, revisão de desenho, inspeção, lote ou serial, desvios e critério de liberação.</p>
<h3>UDI e rastreabilidade são a mesma coisa?</h3>
<p>Não. UDI ajuda identificação e captura de dados, mas rastreabilidade completa também depende da genealogia interna do lote, registros de processo, inspeção, material e liberação.</p>
<h3>O que pedir do fornecedor em cada liberação?</h3>
<p>Peça um pacote proporcional ao risco: CoC, certificado de material, resumo de inspeção, revisão de desenho usada, identificação de lote ou serial, desvios e disposição quando existirem.</p>
<h3>Todo componente precisa de serialização individual?</h3>
<p>Não necessariamente. Serialização, UDI e marcação dependem do produto, requisito do cliente, regulação aplicável e estratégia de identificação. Mesmo quando não há serial individual, a genealogia do lote ainda precisa conectar material, desenho, processo, inspeção e liberação.</p>
<h2>Próximo passo prático</h2>
<p>Pegue o último lote crítico que sua equipe liberou. Abra o checklist de rastreabilidade e serialização e marque, item a item, o que você consegue provar em menos de cinco minutos.</p>
<p>Se algum item exigir caça ao dado em planilha antiga, e-mail ou conversa informal, esse é o ponto onde a rastreabilidade tende a quebrar quando a pressão aumenta.</p>$$,
  excerpt = 'Rastreabilidade de lote não é papelada: veja como material, desenho, processo, inspeção e liberação reduzem o escopo de contenção em implantes e instrumentais.',
  featured_image = '/remotion/assets/images/swiss_implante_espinhal.png',
  seo_title = 'Rastreabilidade de lote em implantes | Lifetrek',
  seo_description = 'Veja o que rastreabilidade de lote deve incluir em implantes e instrumentais: material, desenho, inspeção, UDI, CoC e liberação.',
  keywords = ARRAY['rastreabilidade de lote implantes','genealogia de lote dispositivos médicos','UDI','CoC','certificado de material','serialização','implantes ortopédicos','instrumentais cirúrgicos'],
  metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'icp_primary', 'MI',
      'icp_secondary', jsonb_build_array('OD', 'VT', 'CM'),
      'pillar_keyword', 'rastreabilidade de lote implantes e instrumentais',
      'entity_keywords', jsonb_build_array('rastreabilidade', 'UDI', 'CoC', 'certificado de material', 'lote', 'serialização', 'implantes ortopédicos', 'odontologia', 'veterinário', 'Lifetrek Medical'),
      'locale', 'pt-BR',
      'translation_ready', true,
      'accented_at', '2026-04-28'
    ),
  updated_at = timezone('utc'::text, now())
WHERE slug = 'rastreabilidade-completa-lote-componentes-medicos';
